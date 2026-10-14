import { Inject, Injectable } from '@nestjs/common';
import {
  SEARCH_GROUP_STATUS,
  SOURCE_ACCESS,
  SOURCE_STATUS,
  type SearchGroupStatus,
  type SelectionsResponse,
  type SelectionsSectionQuery,
  type SelectionsSectionResponse,
  type Source,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { NotFoundApiException, SourceAccountRequiredException } from '../common/errors';
import { normalizeTitle } from '../common/normalize';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type {
  RawHomeSectionPage,
  RawHomeSectionParams,
} from '../parsers-client/parsers-client.types';
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
    const source = await this.findSource(userId, sourceId);
    if (source.homeSections.length === 0) {
      return { sourceId, status: SEARCH_GROUP_STATUS.OK, sections: [] };
    }

    const skipped = getSkippedSelectionsStatus(source);
    if (skipped) return { sourceId, status: skipped, sections: [] };

    try {
      const { data } = await withSelectionsTimeout(this.parsersClient.getHome(sourceId));
      // Описание блока — из источника, а не из ответа парсера: кеш главной мог лечь до того,
      // как у блоков появились новые поля.
      const sections = source.homeSections.map((info) => ({
        ...info,
        items: (data.sections.find(({ id }) => id === info.id)?.items ?? []).map((raw) =>
          normalizeTitle(this.env, sourceId, raw),
        ),
      }));
      return { sourceId, status: SEARCH_GROUP_STATUS.OK, sections };
    } catch (error) {
      return { sourceId, status: toFailedStatus(error), sections: [] };
    }
  }

  /**
   * Порция одного блока. Блок, который сайт отдаёт порциями (или по вариантам), парсер листает
   * сам; остальные берутся из общей главной одной порцией — дальше первой страницы у них
   * пусто. Вариант у блока без вариантов не учитывается, чужой или пропущенный — первый.
   */
  async getSection(
    userId: string,
    sourceId: string,
    sectionId: string,
    query: SelectionsSectionQuery,
  ): Promise<SelectionsSectionResponse> {
    const source = await this.findSource(userId, sourceId);
    const section = source.homeSections.find(({ id }) => id === sectionId);
    if (!section) throw new NotFoundApiException('sectionNotFound', { sourceId, sectionId });
    const empty = { sourceId, sectionId, items: [], hasNextPage: false };

    const skipped = getSkippedSelectionsStatus(source);
    if (skipped) return { ...empty, status: skipped };

    const params = {
      page: query.page,
      variant: (section.variants.find(({ id }) => id === query.variant) ?? section.variants[0])?.id,
    };
    try {
      const { items, hasNextPage } = await withSelectionsTimeout(
        this.fetchSectionPage(sourceId, sectionId, params),
      );
      return {
        sourceId,
        sectionId,
        status: SEARCH_GROUP_STATUS.OK,
        items: items.map((raw) => normalizeTitle(this.env, sourceId, raw)),
        hasNextPage,
      };
    } catch (error) {
      return { ...empty, status: toFailedStatus(error) };
    }
  }

  private async fetchSectionPage(
    sourceId: string,
    sectionId: string,
    params: RawHomeSectionParams,
  ): Promise<RawHomeSectionPage> {
    const { data } = await this.parsersClient.getHomeSection(sourceId, sectionId, params);
    if (data.page) return data.page;
    if (params.page > 1) return { items: [], hasNextPage: false };
    const home = await this.parsersClient.getHome(sourceId);
    const items = home.data.sections.find(({ id }) => id === sectionId)?.items ?? [];
    return { items, hasNextPage: false };
  }

  private async findSource(userId: string, sourceId: string): Promise<Source> {
    const source = (await this.sources.listSources(userId)).find(({ id }) => id === sourceId);
    if (!source) throw new NotFoundApiException('sourceNotFound', { sourceId });
    return source;
  }
}

/** Не дождались — запрос к источнику доживает в фоне и кладёт ответ в кеш: повтор отдаст его. */
const withSelectionsTimeout = async <T>(request: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SelectionsTimeoutError()), SELECTIONS_TIMEOUT_MS);
  });
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const toFailedStatus = (error: unknown): SearchGroupStatus => {
  if (error instanceof SelectionsTimeoutError) return SEARCH_GROUP_STATUS.TIMEOUT;
  if (error instanceof SourceAccountRequiredException) return SEARCH_GROUP_STATUS.LOCKED;
  return SEARCH_GROUP_STATUS.ERROR;
};
