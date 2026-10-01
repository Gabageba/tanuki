import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  TITLE_LINK_VERDICT,
  MATCH_CONFIDENCE,
  SEARCH_GROUP_STATUS,
  SOURCE_LOCALE,
  type TitleLinkVerdict,
  type TitleMatchesResponse,
  type MatchConfidence,
  type SearchGroupStatus,
  type Source,
} from '@tanuki/contracts';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import { decodeTitleId, splitCompositeId } from '../common/opaque-id';
import { normalizeTitle } from '../common/normalize';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawTitle } from '../parsers-client/parsers-client.types';
import { SourcesService } from '../sources/sources.service';
import { UserSourcesService } from '../sources/user-sources.service';
import { runAsService } from '../source-accounts/viewer-context';
import { AdultContentService, isAdultSourceHidden } from '../adult-content/adult-content.service';
import { excludeRejected, linkKeyOf, TitleLinksService, parseLinkKey } from './title-links.service';
import {
  FALLBACK_WAVE_TIME_SHARE,
  MATCH_ALGO_VERSION,
  MATCH_DETAILS_BUDGET,
  MATCH_DETAILS_MIN_SCORE,
  PRIMARY_WAVE_TIME_SHARE,
  type MatchSubject,
} from './models';
import { MATCH_WAVE, pickProbe } from './pick-probe';
import { scoreMatch } from './score-match';
import { selectPerSource, type ScoredEntry } from './select-matches';

/** Дедлайн этапа истёк — источник помечается timeout, а не ошибкой. */
class MatchTimeoutError extends Error {}

type Deadline = {
  /** Никогда не резолвится: гонка с ним и есть таймаут. */
  promise: Promise<never>;
  release: () => void;
};

const createDeadline = (ms: number): Deadline => {
  let timer: NodeJS.Timeout;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new MatchTimeoutError()), Math.max(0, ms));
  });
  // Дедлайн почти всегда остаётся отвергнутым: этап успевает раньше. Без этого Node ругался
  // бы на необработанное отклонение.
  promise.catch(() => undefined);

  return { promise, release: () => clearTimeout(timer) };
};

/**
 * Что кладём в кеш. Именно RawTitle, а не готовый Title: normalizeTitle подписывает URL
 * обложки на час (см. img-proxy/sign.util.ts), а кеш живёт сутками — сохранив готовый ответ,
 * мы бы отдавали ссылки с протухшей подписью.
 */
type MatchCacheEntry = {
  sourceId: string;
  raw: RawTitle;
  score: number;
  confidence: MatchConfidence;
  matchedName: string;
  tied: boolean;
};

type MatchCachePayload = {
  items: MatchCacheEntry[];
  failures: { sourceId: string; status: SearchGroupStatus }[];
};

type Candidate = ScoredEntry & {
  raw: RawTitle;
  matchedName: string;
};

export const toMatchSubject = (raw: RawTitle): MatchSubject => ({
  name: raw.title,
  altNames: raw.altTitles,
  authors: raw.authors,
  year: raw.year ?? null,
  type: raw.type ?? null,
  chaptersCount: raw.chapters?.length ?? raw.chaptersCount ?? null,
  tags: raw.tags.map((tag) => tag.title),
});

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly sourcesService: SourcesService,
    private readonly parsersClient: ParsersClientService,
    private readonly cache: CacheService,
    private readonly links: TitleLinksService,
    private readonly userSources: UserSourcesService,
    private readonly adultContent: AdultContentService,
  ) {}

  async findMatches(
    sourceId: string,
    titleId: string,
    userId: string,
  ): Promise<TitleMatchesResponse> {
    const ref = decodeTitleId(titleId);
    const { data: refRaw } = await this.parsersClient.getDetails(sourceId, ref.url);

    const key = cacheKey('matches', sourceId, MATCH_ALGO_VERSION, titleId);
    // Веер и подтверждённые связи кешируются на всех, поэтому идут от сервисной учётки, а не от
    // аккаунтов того, кто открыл тайтл: иначе состав совпадений зависел бы от первого зрителя.
    const { value, stale } = await this.cache.getOrSet(key, CACHE_TTL.matches, () =>
      runAsService(() => this.fanOut(sourceId, refRaw)),
    );

    // Ручные правки накладываются поверх кешированного веера, а не участвуют в нём: правка
    // видна сразу, без ожидания следующего опроса источников.
    const items = await runAsService(() =>
      this.applyLinks(linkKeyOf(sourceId, ref.url), value.items),
    );

    // Веер общий на всех и кешируется целиком — выключенные пользователем источники и скрытые
    // им источники 18+ отсеиваются только в его ответе.
    const [disabled, adultAccess] = await Promise.all([
      this.userSources.getDisabled(userId),
      this.adultContent.getAccess(),
    ]);
    const isShown = (matchSourceId: string) =>
      !disabled.has(matchSourceId) && !isAdultSourceHidden(adultAccess, matchSourceId);

    return {
      items: items.filter((item) => isShown(item.title.sourceId)),
      failures: value.failures.filter((failure) => isShown(failure.sourceId)),
      stale: stale || undefined,
    };
  }

  /**
   * Накладывает решения людей на алгоритмическую выдачу: забракованные пары убирает,
   * подтверждённые поднимает наверх, а подтверждённые, но не найденные веером, дотягивает
   * отдельным запросом деталей. Подтверждённым считается всё, что связано с тайтлом цепочкой
   * подтверждений (см. TitleLinksService.listGroup), а не только прямые связи.
   */
  private async applyLinks(
    refKey: string,
    entries: MatchCacheEntry[],
  ): Promise<TitleMatchesResponse['items']> {
    const [links, group] = await Promise.all([
      this.links.listFor(refKey),
      this.links.listGroup(refKey),
    ]);
    if (links.length === 0 && group.length === 0)
      return entries.map((entry) => this.toMatch(entry));

    const confirmedKeys = new Set(excludeRejected(group, links));
    const rejectedKeys = new Set(
      links
        .filter((link) => link.verdict === TITLE_LINK_VERDICT.REJECTED)
        .map((link) => link.targetId),
    );

    const kept = entries.filter(
      (entry) => !rejectedKeys.has(linkKeyOf(entry.sourceId, entry.raw.url)),
    );

    const confirmed = kept.map((entry) =>
      confirmedKeys.has(linkKeyOf(entry.sourceId, entry.raw.url))
        ? { ...entry, confidence: MATCH_CONFIDENCE.CONFIRMED }
        : entry,
    );

    const found = new Set(confirmed.map((entry) => linkKeyOf(entry.sourceId, entry.raw.url)));
    const missing = [...confirmedKeys].filter((key) => !found.has(key));
    const fetched = await this.fetchConfirmed(missing);

    const items = [...fetched, ...confirmed].map((entry) => this.toMatch(entry));
    // Подтверждённые всегда первыми; остальные уже отсортированы отбором.
    return items.sort(
      (a, b) =>
        Number(b.confidence === MATCH_CONFIDENCE.CONFIRMED) -
        Number(a.confidence === MATCH_CONFIDENCE.CONFIRMED),
    );
  }

  /** Подтверждённые вручную тайтлы, которых веер не нашёл, — их надо запросить отдельно. */
  private async fetchConfirmed(targetKeys: string[]): Promise<MatchCacheEntry[]> {
    const settled = await Promise.allSettled(
      targetKeys.map(async (targetKey) => {
        const { sourceId: targetSourceId, url } = parseLinkKey(targetKey);
        const { data } = await this.parsersClient.getDetails(targetSourceId, url);

        return {
          sourceId: targetSourceId,
          raw: data,
          score: 1,
          confidence: MATCH_CONFIDENCE.CONFIRMED,
          matchedName: data.title,
          tied: false,
        } satisfies MatchCacheEntry;
      }),
    );

    return settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  }

  private toMatch(entry: MatchCacheEntry): TitleMatchesResponse['items'][number] {
    return {
      title: normalizeTitle(this.env, entry.sourceId, entry.raw),
      score: entry.score,
      confidence: entry.confidence,
      matchedName: entry.matchedName,
      tied: entry.tied,
    };
  }

  /** Ставит или снимает ручную пометку связи между текущим тайтлом и указанным. */
  async setLink(
    sourceId: string,
    titleId: string,
    targetId: string,
    verdict: TitleLinkVerdict,
  ): Promise<void> {
    const ref = decodeTitleId(titleId);
    const { data: refRaw } = await this.parsersClient.getDetails(sourceId, ref.url);

    const { sourceId: targetSourceId, opaqueId: targetOpaqueId } = splitCompositeId(targetId);
    const targetUrl = decodeTitleId(targetOpaqueId).url;
    // Связь общая для всех — цель проверяется сервисной учёткой, даже если у пользователя нет
    // аккаунта на её источнике.
    const { data: targetRaw } = await runAsService(() =>
      this.parsersClient.getDetails(targetSourceId, targetUrl),
    );

    await this.links.set(
      linkKeyOf(sourceId, ref.url),
      refRaw.title,
      linkKeyOf(targetSourceId, targetUrl),
      targetRaw.title,
      verdict,
    );
  }

  private async fanOut(sourceId: string, refRaw: RawTitle): Promise<MatchCachePayload> {
    const subject = toMatchSubject(refRaw);
    const primaryProbe = pickProbe(subject, MATCH_WAVE.PRIMARY);
    if (!primaryProbe) return { items: [], failures: [] };

    // Отсев down живёт в listSearchableSources — он одинаково нужен и здесь, и в мультипоиске.
    const sources = (await this.sourcesService.listSearchableSources()).filter(
      (source) => source.id !== sourceId,
    );

    const budget = this.env.MATCH_TIMEOUT_MS;
    const startedAt = Date.now();
    const remaining = () => budget - (Date.now() - startedAt);

    const failures = new Map<string, SearchGroupStatus>();

    const first = await this.withDeadline(budget * PRIMARY_WAVE_TIME_SHARE, (deadline) =>
      this.probeSources(sources, primaryProbe, subject, deadline, failures),
    );

    const exhausted = sources.filter(
      (source) =>
        !first.some((candidate) => candidate.sourceId === source.id) && !failures.has(source.id),
    );
    const second = await this.withDeadline(remaining() * FALLBACK_WAVE_TIME_SHARE, (deadline) =>
      this.runFallbackWave(exhausted, subject, deadline, failures),
    );

    const enriched = await this.withDeadline(remaining(), (deadline) =>
      this.enrichBorderline([...first, ...second], subject, deadline),
    );

    return {
      items: selectPerSource(enriched).map((entry) => ({
        sourceId: entry.sourceId,
        raw: entry.raw,
        score: entry.score,
        confidence: entry.confidence,
        matchedName: entry.matchedName,
        tied: entry.tied,
      })),
      failures: [...failures].map(([id, status]) => ({ sourceId: id, status })),
    };
  }

  private async withDeadline<T>(
    ms: number,
    run: (deadline: Promise<never>) => Promise<T>,
  ): Promise<T> {
    const deadline = createDeadline(ms);
    try {
      return await run(deadline.promise);
    } finally {
      deadline.release();
    }
  }

  /**
   * Вторая волна — русским названием, и только по тем источникам, что на первой не нашли
   * ничего. Она существует ради источников, которые в списке отдают лишь русский заголовок
   * без альтернативных названий (mangabuff, senkuro и другие): латинский зонд там бесполезен.
   */
  private async runFallbackWave(
    exhausted: Source[],
    subject: MatchSubject,
    deadline: Promise<never>,
    failures: Map<string, SearchGroupStatus>,
  ): Promise<Candidate[]> {
    const fallbackProbe = pickProbe(subject, MATCH_WAVE.FALLBACK);
    if (!fallbackProbe || exhausted.length === 0) return [];

    // Русский зонд на англоязычном источнике заведомо ничего не найдёт.
    const targets = exhausted.filter((source) => source.locale !== SOURCE_LOCALE.EN);
    return this.probeSources(targets, fallbackProbe, subject, deadline, failures);
  }

  private async probeSources(
    sources: Source[],
    query: string,
    subject: MatchSubject,
    deadline: Promise<never>,
    failures: Map<string, SearchGroupStatus>,
  ): Promise<Candidate[]> {
    if (sources.length === 0) return [];

    const settled = await Promise.allSettled(
      sources.map((source) =>
        Promise.race([
          this.parsersClient
            .listTitles(source.id, { page: 0, query })
            .then((result) => this.scoreAll(source.id, result.data.items, subject)),
          deadline,
        ]),
      ),
    );

    const candidates: Candidate[] = [];
    settled.forEach((result, index) => {
      const source = sources[index]!;
      if (result.status === 'fulfilled') {
        // Источник, ответивший пустотой на первой волне, не «сломан» — его ещё попробует
        // вторая волна, поэтому в failures он не попадает.
        failures.delete(source.id);
        candidates.push(...result.value);
        return;
      }

      failures.set(
        source.id,
        result.reason instanceof MatchTimeoutError
          ? SEARCH_GROUP_STATUS.TIMEOUT
          : SEARCH_GROUP_STATUS.ERROR,
      );
    });

    return candidates;
  }

  private scoreAll(sourceId: string, items: RawTitle[], subject: MatchSubject): Candidate[] {
    const candidates: Candidate[] = [];
    for (const raw of items) {
      const result = scoreMatch(subject, toMatchSubject(raw));
      if (!result) continue;

      candidates.push({
        sourceId,
        key: raw.url,
        score: result.score,
        confidence: result.confidence,
        matchedName: result.matchedName,
        raw,
      });
    }
    return candidates;
  }

  /**
   * Половина источников не отдаёт altTitles в списках — они появляются только в getDetails.
   * Для таких кандидатов латинского названия просто нет, и сравнивать не с чем. Тех, кто
   * из-за этого завис у порога, добираем деталями — но не больше MATCH_DETAILS_BUDGET штук.
   */
  private async enrichBorderline(
    candidates: Candidate[],
    subject: MatchSubject,
    deadline: Promise<never>,
  ): Promise<Candidate[]> {
    const borderline = candidates
      .filter((candidate) => candidate.raw.altTitles.length === 0)
      .filter((candidate) => candidate.score >= MATCH_DETAILS_MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MATCH_DETAILS_BUDGET);
    if (borderline.length === 0) return candidates;

    const enriched = new Map<string, Candidate>();
    const settled = await Promise.allSettled(
      borderline.map((candidate) =>
        Promise.race([
          this.parsersClient
            .getDetails(candidate.sourceId, candidate.raw.url)
            .then(({ data }) => ({ candidate, data })),
          deadline,
        ]),
      ),
    );

    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;

      const { candidate, data } = result.value;
      const rescored = scoreMatch(subject, toMatchSubject(data));
      if (!rescored) continue;

      enriched.set(`${candidate.sourceId}:${candidate.raw.url}`, {
        ...candidate,
        raw: data,
        score: rescored.score,
        confidence: rescored.confidence,
        matchedName: rescored.matchedName,
      });
    }

    if (enriched.size === 0) return candidates;
    return candidates.map(
      (candidate) => enriched.get(`${candidate.sourceId}:${candidate.raw.url}`) ?? candidate,
    );
  }
}
