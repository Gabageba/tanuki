import { Inject, Injectable } from '@nestjs/common';
import { SOURCE_STATUS_REASON } from '@tanuki/contracts';
import {
  runSourceContract,
  runWithSourceAccounts,
  type FilterSelection,
  type Parser,
  type ParsersRegistry,
  type SourceAccountScope,
} from '@tanuki/parsers';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL, type CacheTtlSpec } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import { SourceHealthService } from '../resilience/source-health.service';
import { SourceStatusService } from '../resilience/source-status.service';
import {
  ConcurrencyLimiterService,
  QueueOverflowError,
} from '../resilience/concurrency-limiter.service';
import {
  RateLimitedException,
  SourceAccountRequiredException,
  SourceAuthRequiredException,
  SourceTokenExpiredException,
  SourceUnavailableException,
} from '../common/errors';
import { SourceAccessService, hasSourceAccount } from '../source-accounts/source-access.service';
import { VIEWER_KIND } from '../source-accounts/models';
import { getViewer } from '../source-accounts/viewer-context';
import { toApiException } from './parser-error.mapper';
import { PARSERS } from './parsers.provider';
import type { RawFilterGroup, RawTitle, RawPage, RawSourceInfo } from './parsers-client.types';

/**
 * Общая для всех часть деталей: без глав, купленных тем, от чьего имени шёл запрос. Если после
 * этого глав не осталось, а платные у тайтла есть, — он для остальных за пейволом.
 */
const withoutPaidChapters = (title: RawTitle): RawTitle => {
  if (!title.chapters?.some((chapter) => chapter.isPaid)) return title;
  return { ...title, chapters: title.chapters.filter((chapter) => !chapter.isPaid) };
};

const PAGE_SIZE = 30;

export type CachedResult<T> = {
  data: T;
  stale: boolean;
};

@Injectable()
export class ParsersClientService {
  constructor(
    @Inject(PARSERS) private readonly parsers: ParsersRegistry,
    private readonly cache: CacheService,
    private readonly sourceHealth: SourceHealthService,
    private readonly sourceStatus: SourceStatusService,
    private readonly concurrencyLimiter: ConcurrencyLimiterService,
    private readonly sourceAccess: SourceAccessService,
  ) {}

  // /sources само по себе не бьёт по внешним сайтам (статические метаданные реестра),
  // поэтому идёт напрямую в кеш, без breaker/rate-limiter — как и раньше.
  async getSources(): Promise<CachedResult<{ items: RawSourceInfo[] }>> {
    // v2 — RawSourceInfo обзавёлся полем `domain`; без смены ключа записи, залитые до деплоя,
    // ещё сутки (staleSeconds) отдавались бы с domain: undefined.
    const result = await this.cache.getOrSet(
      cacheKey('sources', 'all', 'v2'),
      CACHE_TTL.sources,
      () => Promise.resolve({ items: this.parsers.listSources() }),
    );
    return { data: result.value, stale: result.stale };
  }

  /**
   * Прогоняет по источнику полный путь чтения — проверка «жив ли он на самом деле» для
   * SourceProbeService. Возвращает текст ошибки или null при успехе.
   *
   * Сознательно идёт мимо кеша и мимо breaker'а, в отличие от всего остального в этом классе:
   * через guardedFetch пробник получал бы SOURCE_UNAVAILABLE на открытом breaker'е и не смог бы
   * проверить ровно те источники, ради которых нужен. Лимитер при этом на месте — вежливость к
   * сайту от способа вызова не зависит.
   */
  async probe(sourceId: string): Promise<string | null> {
    await this.parsers.ready();
    try {
      const parser = this.parsers.get(sourceId);
      await this.concurrencyLimiter.run(sourceId, () => runSourceContract(parser));
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  async listTitles(
    sourceId: string,
    params: {
      page: number;
      order?: string;
      direction?: string;
      query?: string;
      force?: boolean;
      filters?: FilterSelection[];
    },
  ): Promise<CachedResult<{ items: RawTitle[] }>> {
    // Mirrors parse-filter-query's own wire format (including its `min..max` range syntax) —
    // not parsed back, just kept consistent so a cache key is recognizable next to the request
    // that produced it.
    const filtersKey = (params.filters ?? [])
      .map((f) =>
        'range' in f
          ? `${f.groupId}:${f.range.min ?? ''}..${f.range.max ?? ''}`
          : `${f.groupId}:${f.exclude ? '!' : ''}${f.key}`,
      )
      .sort()
      .join(',');
    const key = cacheKey(
      'catalog',
      sourceId,
      params.page,
      params.order ?? '',
      params.direction ?? '',
      params.query ?? '',
      filtersKey,
    );
    return this.fetchCached(
      key,
      CACHE_TTL.catalog,
      sourceId,
      async (parser) => ({
        items: await parser.getList({
          offset: params.page * PAGE_SIZE,
          limit: PAGE_SIZE,
          order: params.order,
          direction: params.direction,
          query: params.query,
          filters: params.filters,
        }),
      }),
      { force: params.force },
    );
  }

  async getFilters(sourceId: string): Promise<CachedResult<{ groups: RawFilterGroup[] }>> {
    const key = cacheKey('filters', sourceId);
    return this.fetchCached(key, CACHE_TTL.filters, sourceId, async (parser) => ({
      groups: (await parser.getFilters?.()) ?? [],
    }));
  }

  /**
   * Список глав у тайтла с платными главами зависит от аккаунта: купленные видит только
   * купивший. В общий кеш такие главы не попадают, а человеку с аккаунтом детали такого тайтла
   * всегда достаются живым запросом — со всеми его покупками.
   */
  async getDetails(sourceId: string, url: string): Promise<CachedResult<RawTitle>> {
    const key = cacheKey('details', sourceId, url);
    const scope = await this.sourceAccess.resolveScope(sourceId);
    const fetch = (parser: Parser) => parser.getDetails(url);

    const result = await this.cache.getOrSet(
      key,
      CACHE_TTL.details,
      () => this.guardedFetch(sourceId, fetch, scope),
      { toShared: withoutPaidChapters },
    );
    if (!hasSourceAccount(scope) || !result.fromCache || !result.value.hasPaidChapters) {
      return { data: result.value, stale: result.stale };
    }

    try {
      return { data: await this.guardedFetch(sourceId, fetch, scope), stale: false };
    } catch (error) {
      if (error instanceof SourceAccountRequiredException) throw error;
      // Источник не ответил — общая версия без покупок лучше, чем ошибка.
      return { data: result.value, stale: true };
    }
  }

  /**
   * isPaid — глава платная (или её нет в общих деталях): её страницы получает только тот, кто
   * её открыл, и в общий кеш они не кладутся.
   */
  async getPages(
    sourceId: string,
    chapterUrl: string,
    options?: { isPaid?: boolean },
  ): Promise<CachedResult<{ items: RawPage[] }>> {
    const fetch = async (parser: Parser) => ({ items: await parser.getPages(chapterUrl) });
    if (options?.isPaid) {
      const scope = await this.sourceAccess.resolveScope(sourceId);
      return { data: await this.guardedFetch(sourceId, fetch, scope), stale: false };
    }
    const key = cacheKey('pages', sourceId, chapterUrl);
    return this.fetchCached(key, CACHE_TTL.pages, sourceId, fetch);
  }

  private async fetchCached<T>(
    key: string,
    ttl: CacheTtlSpec,
    sourceId: string,
    doFetch: (parser: Parser) => Promise<T>,
    options?: { force?: boolean },
  ): Promise<CachedResult<T>> {
    // До кеша: закрытый для зрителя источник не читается и из общего кеша.
    const scope = await this.sourceAccess.resolveScope(sourceId);
    const result = await this.cache.getOrSet(
      key,
      ttl,
      () => this.guardedFetch(sourceId, doFetch, scope),
      options,
    );
    return { data: result.value, stale: result.stale };
  }

  private async guardedFetch<T>(
    sourceId: string,
    doFetch: (parser: Parser) => Promise<T>,
    scope: SourceAccountScope | undefined,
  ): Promise<T> {
    // Прогрев реестра (SSO-логины) идёт в фоне, чтобы не задерживать старт сервера. Первые
    // запросы к источнику ждут его здесь — иначе они ушли бы анонимными.
    await this.parsers.ready();

    if (!this.sourceHealth.canAttempt(sourceId)) {
      throw new SourceUnavailableException(
        sourceId,
        this.sourceHealth.getRetryAfterSeconds(sourceId),
      );
    }

    // The parser lookup itself can throw (UnknownSourceError/NotImplementedError) — that's
    // not a source-health signal, it's a config/rollout state, so it's mapped and rethrown
    // before entering the breaker/limiter accounting below.
    let parser: Parser;
    try {
      parser = this.parsers.get(sourceId);
    } catch (error) {
      throw toApiException(error, sourceId);
    }

    try {
      // Scope входит внутри лимитера: отложенный в очереди вызов выполняется в контексте того,
      // кто освободил слот, а не того, кто встал в очередь.
      const value = await this.concurrencyLimiter.run(sourceId, () =>
        scope ? runWithSourceAccounts(scope, () => doFetch(parser)) : doFetch(parser),
      );
      this.sourceHealth.recordSuccess(sourceId);
      this.sourceStatus.recordSuccess(sourceId);
      return value;
    } catch (error) {
      if (error instanceof QueueOverflowError) {
        // Очередь переполнена локально — источник вообще не опрашивали, это не сигнал
        // здоровья источника, просто отпускаем пробный half-open слот, если он был занят.
        this.sourceHealth.releaseProbe(sourceId);
        throw new RateLimitedException(sourceId);
      }
      const apiError = toApiException(error, sourceId);
      const viewer = getViewer();
      if (
        scope &&
        viewer.kind === VIEWER_KIND.USER &&
        (apiError instanceof SourceAuthRequiredException ||
          apiError instanceof SourceTokenExpiredException)
      ) {
        // Источник не принял сессию пользователя — дело в его аккаунте, а не в источнике.
        this.sourceHealth.releaseProbe(sourceId);
        await this.sourceAccess.markReloginRequired(viewer.userId, sourceId);
        throw new SourceAccountRequiredException(sourceId, true);
      }
      if (apiError instanceof SourceAuthRequiredException) {
        // Источник ответил, и ответ детерминирован (глава требует авторизации) — это не
        // признак того, что источник "лежит", остальные главы того же источника наверняка
        // грузятся нормально. Не даём этому ни открыть breaker, ни уронить статус источника.
        this.sourceHealth.releaseProbe(sourceId);
        throw apiError;
      }
      // Статус источника меняет не каждая ошибка, а только та, что открыла breaker: до этого
      // момента источник просто спотыкается, а не лежит.
      if (this.sourceHealth.recordFailure(sourceId)) {
        this.sourceStatus.markDegraded(
          sourceId,
          SOURCE_STATUS_REASON.REQUEST_FAILURES,
          apiError.message,
        );
      }
      throw apiError;
    }
  }
}
