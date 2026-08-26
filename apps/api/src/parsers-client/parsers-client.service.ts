import { Inject, Injectable } from '@nestjs/common';
import type { FilterSelection, Parser, ParsersRegistry } from '@tanuki/parsers';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL, type CacheTtlSpec } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import { SourceHealthService } from '../resilience/source-health.service';
import {
  ConcurrencyLimiterService,
  QueueOverflowError,
} from '../resilience/concurrency-limiter.service';
import {
  RateLimitedException,
  SourceAuthRequiredException,
  SourceUnavailableException,
} from '../common/errors';
import { toApiException } from './parser-error.mapper';
import { PARSERS } from './parsers.provider';
import type { RawFilterGroup, RawManga, RawPage, RawSourceInfo } from './parsers-client.types';

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
    private readonly concurrencyLimiter: ConcurrencyLimiterService,
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

  async listManga(
    sourceId: string,
    params: {
      page: number;
      order?: string;
      query?: string;
      force?: boolean;
      filters?: FilterSelection[];
    },
  ): Promise<CachedResult<{ items: RawManga[] }>> {
    const filtersKey = (params.filters ?? [])
      .map((f) => `${f.groupId}:${f.exclude ? '!' : ''}${f.key}`)
      .sort()
      .join(',');
    const key = cacheKey(
      'catalog',
      sourceId,
      params.page,
      params.order ?? '',
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

  async getDetails(sourceId: string, url: string): Promise<CachedResult<RawManga>> {
    const key = cacheKey('details', sourceId, url);
    return this.fetchCached(key, CACHE_TTL.details, sourceId, (parser) => parser.getDetails(url));
  }

  async getPages(
    sourceId: string,
    chapterUrl: string,
  ): Promise<CachedResult<{ items: RawPage[] }>> {
    const key = cacheKey('pages', sourceId, chapterUrl);
    return this.fetchCached(key, CACHE_TTL.pages, sourceId, async (parser) => ({
      items: await parser.getPages(chapterUrl),
    }));
  }

  private async fetchCached<T>(
    key: string,
    ttl: CacheTtlSpec,
    sourceId: string,
    doFetch: (parser: Parser) => Promise<T>,
    options?: { force?: boolean },
  ): Promise<CachedResult<T>> {
    const result = await this.cache.getOrSet(
      key,
      ttl,
      () => this.guardedFetch(sourceId, doFetch),
      options,
    );
    return { data: result.value, stale: result.stale };
  }

  private async guardedFetch<T>(
    sourceId: string,
    doFetch: (parser: Parser) => Promise<T>,
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
      const value = await this.concurrencyLimiter.run(sourceId, () => doFetch(parser));
      this.sourceHealth.recordSuccess(sourceId);
      return value;
    } catch (error) {
      if (error instanceof QueueOverflowError) {
        // Очередь переполнена локально — источник вообще не опрашивали, это не сигнал
        // здоровья источника, просто отпускаем пробный half-open слот, если он был занят.
        this.sourceHealth.releaseProbe(sourceId);
        throw new RateLimitedException(sourceId);
      }
      const apiError = toApiException(error, sourceId);
      if (apiError instanceof SourceAuthRequiredException) {
        // Источник ответил, и ответ детерминирован (глава требует авторизации) — это не
        // признак того, что источник "лежит", остальные главы того же источника наверняка
        // грузятся нормально. Не даём этому открыть breaker на весь источник на 10 минут.
        this.sourceHealth.releaseProbe(sourceId);
        throw apiError;
      }
      this.sourceHealth.recordFailure(sourceId);
      throw apiError;
    }
  }
}
