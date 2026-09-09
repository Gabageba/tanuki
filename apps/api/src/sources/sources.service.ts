import { Inject, Injectable } from '@nestjs/common';
import {
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  type Source,
  type SourceContentType,
  type SourcesResponse,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { NotFoundApiException } from '../common/errors';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawSourceInfo } from '../parsers-client/parsers-client.types';
import { SourceStatusService } from '../resilience/source-status.service';

/** Order of the groups in the response — objects keep insertion order over JSON. */
const CONTENT_TYPES = Object.values(SOURCE_CONTENT_TYPE) as SourceContentType[];

/** Контракт требует строку — Date отдаётся в серверном формате YYYY-MM-DDTHH:MM:SSZ. */
const toIsoSeconds = (value: Date | null): string | null => {
  return value ? `${value.toISOString().slice(0, 19)}Z` : null;
};

@Injectable()
export class SourcesService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
    private readonly sourceStatus: SourceStatusService,
  ) {}

  /** Плоский список — им пользуется SearchService, которому группировка только мешает. */
  async listSources(): Promise<Source[]> {
    return (await this.enabledSources()).map((source) => this.toSource(source));
  }

  /**
   * Кого имеет смысл опрашивать веером — этим пользуются и мультипоиск, и матчинг.
   *
   * Флаг isSearchSupported живёт только в метаданных парсера: наружу, в контракте Source, он не
   * выходит, поэтому отбор делается здесь, а не у вызывающего. Заодно отсеиваются down и degraded:
   * веер ограничен одним общим дедлайном, и заведомо нездоровый источник в нём отъедает время у
   * живых. На /sources это не влияет — там отдаются все, включая degraded и down.
   *
   * Залипнуть в down/degraded источник при этом не может: ночной пробник ходит и в них тоже,
   * независимо от того, шлёт ли туда кто-нибудь живые запросы.
   */
  async listSearchableSources(): Promise<Source[]> {
    return (await this.enabledSources())
      .filter((source) => source.isSearchSupported)
      .map((source) => this.toSource(source))
      .filter((source) => source.status === SOURCE_STATUS.OK);
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
    // isBroken — жёсткий оверрайд, а не стартовое значение: это решение человека о том, что
    // источник не парсится в принципе (JS-челлендж, мёртвый TLS). Автоматика его не трогает, и
    // случайный удачный запрос не должен его снимать — такие источники даже не пробуются.
    const entry = this.sourceStatus.get(raw.id);
    return {
      id: raw.id,
      title: raw.title,
      domain: raw.domain,
      locale: raw.locale,
      // contentType парсеры берут из того же SOURCE_CONTENT_TYPE, что и контракт, — отдаём
      // значение как есть, без нормализации.
      contentType: raw.contentType,
      status: raw.isBroken ? SOURCE_STATUS.DOWN : entry.status,
      statusReason: raw.isBroken ? SOURCE_STATUS_REASON.BROKEN : entry.reason,
      statusChangedAt: raw.isBroken ? null : toIsoSeconds(entry.statusChangedAt),
      checkedAt: raw.isBroken ? null : toIsoSeconds(entry.checkedAt),
      failedProbeStreak: raw.isBroken ? 0 : entry.failedProbeStreak,
      lastError: raw.isBroken ? null : entry.lastError,
      isAdult: raw.isAdult,
      requiresVpn: raw.requiresVpn,
      sortOrders: raw.sortOrders,
      supportsDirection: raw.supportsDirection,
    };
  }
}
