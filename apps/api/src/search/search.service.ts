import { Inject, Injectable } from '@nestjs/common';
import { unappliedSearchFilters } from '@tanuki/parsers';
import {
  SEARCH_GROUP_STATUS,
  SOURCE_ACCESS,
  SOURCE_STATUS,
  type SearchGroup,
  type SearchResponse,
  type Source,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { CatalogService } from '../catalog/catalog.service';
import { SourcesService } from '../sources/sources.service';
import { SearchHistoryService } from './search-history.service';

class SearchTimeoutError extends Error {}

export type SearchParams = {
  query: string;
  /** Пересечение с источниками пользователя; undefined — все. */
  sourceIds?: string[];
  types?: TitleType[];
  states?: TitleState[];
  limit: number;
  userId: string;
};

/** Исход источника, который веер не опрашивает; undefined — опрашивается. */
const getSkippedStatus = (source: Source) => {
  // Закрытые для пользователя источники не опрашиваются — у него нет на них аккаунта.
  if (source.access !== SOURCE_ACCESS.AVAILABLE) return SEARCH_GROUP_STATUS.LOCKED;
  // Заведомо нездоровый источник отъел бы общий дедлайн у живых (см. listSearchableSources).
  if (source.status !== SOURCE_STATUS.OK) return SEARCH_GROUP_STATUS.UNAVAILABLE;
  return undefined;
};

@Injectable()
export class SearchService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly sourcesService: SourcesService,
    private readonly catalogService: CatalogService,
    private readonly searchHistory: SearchHistoryService,
  ) {}

  async search(params: SearchParams): Promise<SearchResponse> {
    const { query, sourceIds, types, states, limit, userId } = params;
    // Запись в историю идёт параллельно вееру и сама переживает сбой базы.
    const recorded = this.searchHistory.record(userId, query);
    const sources = (await this.sourcesService.listSearchSources(userId)).filter(
      (source) => !sourceIds || sourceIds.includes(source.id),
    );
    const criteria = { types, states };

    // Один общий дедлайн на весь веер (docs/04-api-contract.md) — источник, не уложившийся
    // в него, помечается timeout, а не получает свой персональный тайм-аут.
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new SearchTimeoutError()), this.env.SEARCH_TIMEOUT_MS);
    });

    try {
      // Порядок групп — порядок источников пользователя (Source.position), в нём их отдаёт
      // listSearchSources.
      const groups = await Promise.all(
        sources.map(async (source): Promise<SearchGroup> => {
          const sourceId = source.id;
          const skipped = getSkippedStatus(source);
          if (skipped)
            return { sourceId, status: skipped, items: [], unappliedFilters: [], filters: [] };

          try {
            // Критерии идут источнику его собственными фильтрами; не умеющий их совмещать с
            // поиском по названию (или выбранное не выразить) отдаёт выдачу без сужения.
            const { filters, unapplied } = source.isSearchWithFiltersSupported
              ? this.catalogService.resolveSearchFilters(sourceId, criteria)
              : unappliedSearchFilters(criteria);
            const catalog = await Promise.race([
              this.catalogService.listCatalog(sourceId, {
                page: 0,
                query,
                filters: filters.length ? filters : undefined,
              }),
              timeoutPromise,
            ]);
            return {
              sourceId,
              status: SEARCH_GROUP_STATUS.OK,
              items: catalog.items.slice(0, limit),
              unappliedFilters: unapplied,
              filters,
            };
          } catch (error) {
            const status =
              error instanceof SearchTimeoutError
                ? SEARCH_GROUP_STATUS.TIMEOUT
                : SEARCH_GROUP_STATUS.ERROR;
            return { sourceId, status, items: [], unappliedFilters: [], filters: [] };
          }
        }),
      );

      await recorded;
      return { groups };
    } finally {
      clearTimeout(timer!);
    }
  }
}
