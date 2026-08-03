import { Inject, Injectable } from '@nestjs/common';
import { request } from 'undici';
import { ENV } from '../config/env.module';
import type { Env } from '../config/env';
import { CacheService } from '../cache/cache.service';
import { CACHE_TTL, type CacheTtlSpec } from '../cache/cache.constants';
import { cacheKey } from '../cache/cache-keys';
import { SourceHealthService } from '../resilience/source-health.service';
import {
  ConcurrencyLimiterService,
  QueueOverflowError,
} from '../resilience/concurrency-limiter.service';
import { looksLikeAntibotChallenge } from './antibot-detection';
import {
  NotFoundApiException,
  ParserFailedException,
  RateLimitedException,
  SourceAuthRequiredException,
  SourceBlockedException,
  SourceUnavailableException,
} from '../common/errors';
import type { RawManga, RawPage, RawSourceInfo } from './parsers-client.types';

type QueryValue = string | number | undefined;

export interface CachedResult<T> {
  data: T;
  stale: boolean;
}

@Injectable()
export class ParsersClientService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly cache: CacheService,
    private readonly sourceHealth: SourceHealthService,
    private readonly concurrencyLimiter: ConcurrencyLimiterService,
  ) {}

  // /sources сам по себе не бьёт по внешним сайтам (сайдкар читает только статические
  // метаданные парсера), поэтому идёт напрямую в кеш, без breaker/rate-limiter.
  async getSources(): Promise<CachedResult<{ items: RawSourceInfo[] }>> {
    const result = await this.cache.getOrSet(cacheKey('sources', 'all'), CACHE_TTL.sources, () =>
      this.httpGet<{ items: RawSourceInfo[] }>('/sources'),
    );
    return { data: result.value, stale: result.stale };
  }

  async listManga(
    sourceId: string,
    params: { page: number; order?: string; query?: string },
  ): Promise<CachedResult<{ items: RawManga[] }>> {
    const key = cacheKey('catalog', sourceId, params.page, params.order ?? '', params.query ?? '');
    return this.fetchCached(key, CACHE_TTL.catalog, sourceId, () =>
      this.httpGet<{ items: RawManga[] }>(`/sources/${sourceId}/list`, params),
    );
  }

  async getDetails(sourceId: string, url: string): Promise<CachedResult<RawManga>> {
    const key = cacheKey('details', sourceId, url);
    return this.fetchCached(key, CACHE_TTL.details, sourceId, () =>
      this.httpGet<RawManga>(`/sources/${sourceId}/details`, { url }),
    );
  }

  async getPages(
    sourceId: string,
    chapterUrl: string,
  ): Promise<CachedResult<{ items: RawPage[] }>> {
    const key = cacheKey('pages', sourceId, chapterUrl);
    return this.fetchCached(key, CACHE_TTL.pages, sourceId, () =>
      this.httpGet<{ items: RawPage[] }>(`/sources/${sourceId}/pages`, { chapterUrl }),
    );
  }

  private async fetchCached<T>(
    key: string,
    ttl: CacheTtlSpec,
    sourceId: string,
    doFetch: () => Promise<T>,
  ): Promise<CachedResult<T>> {
    const result = await this.cache.getOrSet(key, ttl, () => this.guardedFetch(sourceId, doFetch));
    return { data: result.value, stale: result.stale };
  }

  private async guardedFetch<T>(sourceId: string, doFetch: () => Promise<T>): Promise<T> {
    if (!this.sourceHealth.canAttempt(sourceId)) {
      throw new SourceUnavailableException(
        sourceId,
        this.sourceHealth.getRetryAfterSeconds(sourceId),
      );
    }

    try {
      const value = await this.concurrencyLimiter.run(sourceId, doFetch);
      this.sourceHealth.recordSuccess(sourceId);
      return value;
    } catch (error) {
      if (error instanceof QueueOverflowError) {
        // Очередь переполнена локально — источник вообще не опрашивали, это не сигнал
        // здоровья источника, просто отпускаем пробный half-open слот, если он был занят.
        this.sourceHealth.releaseProbe(sourceId);
        throw new RateLimitedException(sourceId);
      }
      if (error instanceof SourceAuthRequiredException) {
        // Источник ответил, и ответ детерминирован (глава требует авторизации) — это не
        // признак того, что источник "лежит", остальные главы того же источника наверняка
        // грузятся нормально. Не даём этому открыть breaker на весь источник на 10 минут.
        this.sourceHealth.releaseProbe(sourceId);
        throw error;
      }
      this.sourceHealth.recordFailure(sourceId);
      throw error;
    }
  }

  private async httpGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    const url = new URL(path, this.env.PARSERS_URL);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const sourceId = path.split('/')[2];

    let response;
    try {
      response = await request(url, { method: 'GET' });
    } catch {
      throw new SourceUnavailableException(sourceId);
    }

    if (response.statusCode < 400) {
      return (await response.body.json()) as T;
    }

    const body = await response.body.text();

    if (looksLikeAntibotChallenge(response.statusCode, response.headers, body)) {
      throw new SourceBlockedException(sourceId);
    }
    if (response.statusCode === 404) {
      throw new NotFoundApiException();
    }
    if (response.statusCode === 401) {
      throw new SourceAuthRequiredException(sourceId);
    }
    if (response.statusCode >= 500) {
      throw new SourceUnavailableException(sourceId);
    }
    throw new ParserFailedException(body, sourceId);
  }
}
