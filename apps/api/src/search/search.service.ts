import { Inject, Injectable } from '@nestjs/common';
import type { SearchGroup, SearchResponse } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { CatalogService } from '../catalog/catalog.service';
import { SourcesService } from '../sources/sources.service';

class SearchTimeoutError extends Error {}

@Injectable()
export class SearchService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly sourcesService: SourcesService,
    private readonly catalogService: CatalogService,
  ) {}

  async search(
    query: string,
    sourceIds: string[] | undefined,
    limit: number,
  ): Promise<SearchResponse> {
    const sources = await this.sourcesService.listSources();
    const candidates = sources.filter(
      (source) => source.capabilities.search && (!sourceIds || sourceIds.includes(source.id)),
    );

    // Один общий дедлайн на весь веер (docs/04-api-contract.md) — источник, не уложившийся
    // в него, помечается timeout, а не получает свой персональный тайм-аут.
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new SearchTimeoutError()), this.env.SEARCH_TIMEOUT_MS);
    });

    try {
      const settled = await Promise.allSettled(
        candidates.map((source) =>
          Promise.race([
            this.catalogService
              .listCatalog(source.id, { page: 0, query })
              .then((catalog) => catalog.items.slice(0, limit)),
            timeoutPromise,
          ]),
        ),
      );

      const groups: SearchGroup[] = settled.map((result, index) => {
        const sourceId = candidates[index]!.id;
        if (result.status === 'fulfilled') {
          return { sourceId, status: 'ok', items: result.value };
        }
        const status = result.reason instanceof SearchTimeoutError ? 'timeout' : 'error';
        return { sourceId, status, items: [] };
      });

      return { groups };
    } finally {
      clearTimeout(timer!);
    }
  }
}
