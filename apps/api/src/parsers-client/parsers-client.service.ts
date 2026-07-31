import { Inject, Injectable } from '@nestjs/common';
import { request } from 'undici';
import { ENV } from '../config/env.module';
import type { Env } from '../config/env';
import {
  NotFoundApiException,
  ParserFailedException,
  SourceUnavailableException,
} from '../common/errors';
import type { RawManga, RawPage, RawSourceInfo } from './parsers-client.types';

type QueryValue = string | number | undefined;

@Injectable()
export class ParsersClientService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  getSources(): Promise<{ items: RawSourceInfo[] }> {
    return this.get('/sources');
  }

  listManga(
    sourceId: string,
    params: { page: number; order?: string; query?: string },
  ): Promise<{ items: RawManga[] }> {
    return this.get(`/sources/${sourceId}/list`, params);
  }

  getDetails(sourceId: string, url: string): Promise<RawManga> {
    return this.get(`/sources/${sourceId}/details`, { url });
  }

  getPages(sourceId: string, chapterUrl: string): Promise<{ items: RawPage[] }> {
    return this.get(`/sources/${sourceId}/pages`, { chapterUrl });
  }

  private async get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
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

    if (response.statusCode === 404) {
      throw new NotFoundApiException();
    }
    if (response.statusCode >= 500) {
      throw new SourceUnavailableException(sourceId);
    }
    if (response.statusCode >= 400) {
      const body = await response.body.text();
      throw new ParserFailedException(body, sourceId);
    }

    return (await response.body.json()) as T;
  }
}
