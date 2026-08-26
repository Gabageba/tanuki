import { Inject, Injectable } from '@nestjs/common';
import {
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  type Source,
  type SourceContentType,
  type SourcesResponse,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { NotFoundApiException } from '../common/errors';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawSourceInfo } from '../parsers-client/parsers-client.types';
import { SourceHealthService } from '../resilience/source-health.service';

/** Order of the groups in the response — objects keep insertion order over JSON. */
const CONTENT_TYPES = Object.values(SOURCE_CONTENT_TYPE) as SourceContentType[];

@Injectable()
export class SourcesService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
    private readonly sourceHealth: SourceHealthService,
  ) {}

  /** Плоский список — им пользуется SearchService, которому группировка только мешает. */
  async listSources(): Promise<Source[]> {
    return (await this.enabledSources()).map((source) => this.toSource(source));
  }

  /**
   * Флаг isSearchSupported живёт только в метаданных парсера: наружу, в контракте Source, он
   * не выходит, поэтому отбор источников для мультипоиска делается здесь, а не у вызывающего.
   */
  async listSearchableSources(): Promise<Source[]> {
    return (await this.enabledSources())
      .filter((source) => source.isSearchSupported)
      .map((source) => this.toSource(source));
  }

  async getSource(sourceId: string): Promise<Source> {
    const source = (await this.listSources()).find((item) => item.id === sourceId);
    if (!source) {
      throw new NotFoundApiException(`Источник ${sourceId} не найден`);
    }
    return source;
  }

  async listGroupedSources(): Promise<SourcesResponse> {
    const groups = Object.fromEntries(
      CONTENT_TYPES.map((contentType) => [contentType, [] as Source[]]),
    ) as SourcesResponse;
    for (const source of await this.listSources()) {
      groups[source.contentType].push(source);
    }
    return groups;
  }

  private async enabledSources(): Promise<RawSourceInfo[]> {
    const { data } = await this.parsersClient.getSources();
    // RawSourceInfo.id — просто string, DISABLED_SOURCES сужен до SourceId: сравниваем
    // поэлементно, чтобы не приводить типы вручную.
    return data.items.filter(
      (source) => !this.env.DISABLED_SOURCES.some((disabled) => disabled === source.id),
    );
  }

  private toSource(raw: RawSourceInfo): Source {
    return {
      id: raw.id,
      title: raw.title,
      domain: raw.domain,
      locale: raw.locale,
      // contentType парсеры берут из того же SOURCE_CONTENT_TYPE, что и контракт, — отдаём
      // значение как есть, без нормализации.
      contentType: raw.contentType,
      status: raw.isBroken ? SOURCE_STATUS.down : this.sourceHealth.getStatus(raw.id),
      isAdult: raw.isAdult,
      sortOrders: raw.sortOrders,
    };
  }
}
