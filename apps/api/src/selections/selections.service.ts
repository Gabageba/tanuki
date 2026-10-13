import { Inject, Injectable } from '@nestjs/common';
import {
  SEARCH_GROUP_STATUS,
  SOURCE_ACCESS,
  SOURCE_STATUS,
  type SearchGroupStatus,
  type SelectionsResponse,
  type Source,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { NotFoundApiException, SourceAccountRequiredException } from '../common/errors';
import { normalizeTitle } from '../common/normalize';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { SourcesService } from '../sources/sources.service';
import { SELECTIONS_TIMEOUT_MS } from './models';

class SelectionsTimeoutError extends Error {}

/**
 * Исход источника, которого подборки не опрашивают; undefined — опрашиваются. Закрытый без
 * аккаунта источник не опрашивается, хотя главная сайта отдалась бы и гостю: её тайтлы всё равно
 * не открыть. Нездоровый — чтобы не ждать заведомо упавший сайт.
 */
export const getSkippedSelectionsStatus = (source: Source): SearchGroupStatus | undefined => {
  if (source.access !== SOURCE_ACCESS.AVAILABLE) return SEARCH_GROUP_STATUS.LOCKED;
  if (source.status !== SOURCE_STATUS.OK) return SEARCH_GROUP_STATUS.UNAVAILABLE;
  return undefined;
};

/**
 * Подборки источника — блоки с главной его сайта. Отдаются все описанные блоки: какие из них
 * показывать, решают настройки пользователя на фронте, а кеш один на всех. Не ответивший
 * источник — не ошибка запроса, а статус в ответе, как у группы мультипоиска: страница рисует
 * причину на месте блоков.
 */
@Injectable()
export class SelectionsService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly sources: SourcesService,
    private readonly parsersClient: ParsersClientService,
  ) {}

  async get(userId: string, sourceId: string): Promise<SelectionsResponse> {
    const source = (await this.sources.listSources(userId)).find(({ id }) => id === sourceId);
    if (!source) throw new NotFoundApiException('sourceNotFound', { sourceId });
    if (source.homeSections.length === 0) {
      return { sourceId, status: SEARCH_GROUP_STATUS.OK, sections: [] };
    }

    const skipped = getSkippedSelectionsStatus(source);
    if (skipped) return { sourceId, status: skipped, sections: [] };

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new SelectionsTimeoutError()), SELECTIONS_TIMEOUT_MS);
    });
    try {
      // Не дождались — запрос к источнику доживает в фоне и кладёт ответ в кеш: повтор отдаст его.
      const { data } = await Promise.race([this.parsersClient.getHome(sourceId), timeout]);
      return {
        sourceId,
        status: SEARCH_GROUP_STATUS.OK,
        sections: data.sections.map(({ id, title, items }) => ({
          id,
          title,
          items: items.map((raw) => normalizeTitle(this.env, sourceId, raw)),
        })),
      };
    } catch (error) {
      return { sourceId, status: toFailedStatus(error), sections: [] };
    } finally {
      clearTimeout(timer);
    }
  }
}

const toFailedStatus = (error: unknown): SearchGroupStatus => {
  if (error instanceof SelectionsTimeoutError) return SEARCH_GROUP_STATUS.TIMEOUT;
  if (error instanceof SourceAccountRequiredException) return SEARCH_GROUP_STATUS.LOCKED;
  return SEARCH_GROUP_STATUS.ERROR;
};
