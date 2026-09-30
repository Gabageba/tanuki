import { Inject, Injectable } from '@nestjs/common';
import {
  catalogEntryFor,
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
import { SourceAccessService, type SourceLogin } from '../source-accounts/source-access.service';
import { UserSourcesService } from './user-sources.service';

/** Order of the groups in the response — objects keep insertion order over JSON. */
const CONTENT_TYPES = Object.values(SOURCE_CONTENT_TYPE) as SourceContentType[];

/** Контракт требует строку — Date отдаётся в серверном формате YYYY-MM-DDTHH:MM:SSZ. */
const toIsoSeconds = (value: Date | null): string | null => {
  return value ? `${value.toISOString().slice(0, 19)}Z` : null;
};

/**
 * Источники в порядке пользователя. Те, которых в его порядке нет (новые или порядок не задан),
 * идут следом, как в каталоге, — сортировка устойчивая.
 */
const sortByUserOrder = (raws: RawSourceInfo[], order: string[]): RawSourceInfo[] => {
  const rankOf = (raw: RawSourceInfo) => {
    const index = order.indexOf(raw.id);
    return index === -1 ? order.length : index;
  };
  return [...raws].sort((a, b) => rankOf(a) - rankOf(b));
};

@Injectable()
export class SourcesService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
    private readonly sourceStatus: SourceStatusService,
    private readonly userSources: UserSourcesService,
    private readonly sourceAccess: SourceAccessService,
  ) {}

  /**
   * Плоский список всех источников. userId только размечает isEnabled — выключенные
   * пользователем источники здесь остаются: их показывают настройки, чтобы включить обратно.
   */
  async listSources(userId?: string): Promise<Source[]> {
    return this.buildSources(userId, () => true);
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
   *
   * С userId отсеиваются и источники, которые пользователь выключил в настройках. Закрытые для
   * него источники остаются — поиск показывает их отдельным статусом.
   */
  async listSearchableSources(userId?: string): Promise<Source[]> {
    return (await this.buildSources(userId, (raw) => raw.isSearchSupported)).filter(
      (source) => source.status === SOURCE_STATUS.OK && source.isEnabled,
    );
  }

  async getSource(sourceId: string): Promise<Source> {
    const source = (await this.listSources()).find((item) => item.id === sourceId);
    if (!source) {
      throw new NotFoundApiException('sourceNotFound', { sourceId });
    }
    return source;
  }

  async listGroupedSources(userId?: string): Promise<SourcesResponse> {
    const groups = Object.fromEntries(
      CONTENT_TYPES.map((contentType) => [contentType, [] as Source[]]),
    ) as SourcesResponse;
    for (const source of await this.listSources(userId)) {
      groups[source.contentType].push(source);
    }
    return groups;
  }

  private async buildSources(
    userId: string | undefined,
    include: (raw: RawSourceInfo) => boolean,
  ): Promise<Source[]> {
    const [raws, disabled, loginOf, order] = await Promise.all([
      this.enabledSources(),
      this.userSources.getDisabled(userId),
      this.sourceAccess.getLoginResolver(userId),
      this.userSources.getOrder(userId),
    ]);
    // Место считается по всем источникам, до отбора: оно одно и то же в любом списке.
    return sortByUserOrder(raws, order)
      .map((raw, position) => ({ raw, position }))
      .filter(({ raw }) => include(raw))
      .map(({ raw, position }) => this.toSource(raw, disabled, loginOf, position));
  }

  private async enabledSources(): Promise<RawSourceInfo[]> {
    const { data } = await this.parsersClient.getSources();
    // RawSourceInfo.id — просто string, DISABLED_SOURCES сужен до SourceId: сравниваем
    // поэлементно, чтобы не приводить типы вручную.
    return data.items.filter(
      (source) => !this.env.DISABLED_SOURCES.some((disabled) => disabled === source.id),
    );
  }

  private toSource(
    raw: RawSourceInfo,
    disabled: ReadonlySet<string>,
    loginOf: (sourceId: string) => SourceLogin,
    position: number,
  ): Source {
    const catalogEntry = catalogEntryFor(raw.id);
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
      authFamily: catalogEntry.authFamily,
      loginBenefits: catalogEntry.loginBenefits,
      isEnabled: !disabled.has(raw.id),
      position,
      ...loginOf(raw.id),
    };
  }
}
