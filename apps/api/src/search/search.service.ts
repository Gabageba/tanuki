import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { unappliedSearchFilters } from '@tanuki/parsers';
import {
  SEARCH_GROUP_STATUS,
  SEARCH_STREAM_EVENT,
  SOURCE_ACCESS,
  SOURCE_LOGIN_BENEFIT,
  SOURCE_STATUS,
  type SearchGroup,
  type SearchGroupStatus,
  type SearchSourcesEvent,
  type Source,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { CatalogService } from '../catalog/catalog.service';
import { SourcesService } from '../sources/sources.service';
import { SearchHistoryService } from './search-history.service';

export type SearchParams = {
  query: string;
  /** Пересечение с источниками пользователя; undefined — все. */
  sourceIds?: string[];
  types?: TitleType[];
  states?: TitleState[];
  limit: number;
  userId: string;
  /** Повтор по не ответившим: в историю не пишется. */
  isRetry?: boolean;
};

/** Событие потока поиска — в форме `MessageEvent` Nest: `type` уходит в `event:`, `data` — JSON. */
export type SearchStreamMessage =
  | { type: typeof SEARCH_STREAM_EVENT.SOURCES; data: SearchSourcesEvent }
  | { type: typeof SEARCH_STREAM_EVENT.GROUP; data: SearchGroup }
  | { type: typeof SEARCH_STREAM_EVENT.DONE; data: Record<string, never> };

const emptyGroup = (sourceId: string, status: SearchGroupStatus): SearchGroup => ({
  sourceId,
  status,
  items: [],
  unappliedFilters: [],
  filters: [],
});

/** Исход источника, который веер не опрашивает; undefined — опрашивается. */
const getSkippedStatus = (source: Source) => {
  // Закрытые для пользователя источники не опрашиваются — у него нет на них аккаунта.
  if (source.access !== SOURCE_ACCESS.AVAILABLE) return SEARCH_GROUP_STATUS.LOCKED;
  // Источник открыт и без аккаунта, но сам поиск по названию сайт отдаёт только вошедшим.
  if (source.loginBenefits.includes(SOURCE_LOGIN_BENEFIT.TITLE_SEARCH) && !source.isLoggedIn) {
    return SEARCH_GROUP_STATUS.LOCKED;
  }
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

  /**
   * Веер поиска потоком: `sources` — порядок мест, затем `group` на источник, как только он
   * ответил (пропущенные — сразу), в конце `done`. Один общий дедлайн на весь веер
   * (docs/04-api-contract.md): в его момент все не ответившие уходят группами `timeout`. Отписка
   * (клиент закрыл соединение) останавливает поток; запросы к источникам доживают сами.
   */
  search(params: SearchParams): Observable<SearchStreamMessage> {
    return new Observable<SearchStreamMessage>((subscriber) => {
      let timer: NodeJS.Timeout | undefined;
      const pending = new Set<string>();

      const finish = () => {
        clearTimeout(timer);
        subscriber.next({ type: SEARCH_STREAM_EVENT.DONE, data: {} });
        subscriber.complete();
      };

      const answer = (group: SearchGroup) => {
        if (subscriber.closed || !pending.delete(group.sourceId)) return;
        subscriber.next({ type: SEARCH_STREAM_EVENT.GROUP, data: group });
        if (pending.size === 0) finish();
      };

      const run = async () => {
        const { query, sourceIds, types, states, limit, userId, isRetry } = params;
        // Запись в историю идёт параллельно вееру и сама переживает сбой базы.
        if (!isRetry) void this.searchHistory.record(userId, query);
        // Порядок мест — порядок источников пользователя (Source.position), в нём их отдаёт
        // listSearchSources.
        const sources = (await this.sourcesService.listSearchSources(userId)).filter(
          (source) => !sourceIds || sourceIds.includes(source.id),
        );
        if (subscriber.closed) return;

        sources.forEach(({ id }) => pending.add(id));
        subscriber.next({
          type: SEARCH_STREAM_EVENT.SOURCES,
          data: { sourceIds: sources.map(({ id }) => id) },
        });
        if (pending.size === 0) {
          finish();
          return;
        }

        timer = setTimeout(() => {
          for (const sourceId of [...pending]) {
            answer(emptyGroup(sourceId, SEARCH_GROUP_STATUS.TIMEOUT));
          }
        }, this.env.SEARCH_TIMEOUT_MS);

        const criteria = { types, states };
        const polled = sources.filter((source) => {
          const skipped = getSkippedStatus(source);
          if (skipped) answer(emptyGroup(source.id, skipped));
          return !skipped;
        });

        for (const source of polled) {
          const sourceId = source.id;
          // Критерии идут источнику его собственными фильтрами; не умеющий их совмещать с
          // поиском по названию (или выбранное не выразить) отдаёт выдачу без сужения.
          const { filters, unapplied } = source.isSearchWithFiltersSupported
            ? this.catalogService.resolveSearchFilters(sourceId, criteria)
            : unappliedSearchFilters(criteria);
          this.catalogService
            .listCatalog(sourceId, {
              page: 0,
              limit,
              query,
              filters: filters.length ? filters : undefined,
            })
            .then(
              (catalog) =>
                answer({
                  sourceId,
                  status: SEARCH_GROUP_STATUS.OK,
                  items: catalog.items.slice(0, limit),
                  unappliedFilters: unapplied,
                  filters,
                }),
              () => answer(emptyGroup(sourceId, SEARCH_GROUP_STATUS.ERROR)),
            );
        }
      };

      run().catch((error: unknown) => subscriber.error(error));

      return () => clearTimeout(timer);
    });
  }
}
