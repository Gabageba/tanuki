import {
  getSelectionsSectionKey,
  SEARCH_GROUP_STATUS,
  SOURCE_ACCESS,
  SOURCE_STATUS,
  type HomeSectionInfo,
  type Source,
  type UserSettings,
} from '@tanuki/contracts';
import type { MissStatus } from '@/entities/source/models';
import { LAST_SELECTIONS_SOURCE_STORAGE_KEY } from './models';

/** Все блоки источника в порядке пользователя; не попавшие в его порядок (новые) — в конце, в
 *  порядке сайта. */
export const getOrderedSections = (
  source: Source,
  settings: UserSettings | undefined,
): HomeSectionInfo[] => {
  const order = settings?.selectionsSectionOrder ?? [];
  const getPosition = ({ id }: HomeSectionInfo) => {
    const index = order.indexOf(getSelectionsSectionKey(source.id, id));
    return index === -1 ? order.length : index;
  };
  // sort стабилен: блоки вне порядка пользователя остаются в порядке сайта.
  return [...source.homeSections].sort((a, b) => getPosition(a) - getPosition(b));
};

/** Блоки источника, которые пользователь не выключил, — в его порядке. */
export const getEnabledSections = (
  source: Source,
  settings: UserSettings | undefined,
): HomeSectionInfo[] => {
  const disabled = settings?.selectionsDisabledSections ?? [];
  return getOrderedSections(source, settings).filter(
    ({ id }) => !disabled.includes(getSelectionsSectionKey(source.id, id)),
  );
};

/**
 * Источники подборок в общем порядке: у парсера есть главная, источник включён, не убран из
 * подборок и у него остался хоть один блок. Скрытых настройкой 18+ в списке источников нет
 * вовсе.
 */
export const getSelectionsSources = (
  sources: Source[],
  settings: UserSettings | undefined,
): Source[] => {
  const disabled = settings?.selectionsDisabledSources ?? [];
  return sources.filter(
    (source) =>
      source.isEnabled &&
      !disabled.includes(source.id) &&
      getEnabledSections(source, settings).length > 0,
  );
};

/** Источник, который подборки не опрашивают, и почему; undefined — опрашивают. Тот же отбор,
 *  что на сервере: закрытый без аккаунта и нездоровый источник ответить не могут. */
export const getSkippedSelectionsStatus = (source: Source): MissStatus | undefined => {
  if (source.access !== SOURCE_ACCESS.AVAILABLE) return SEARCH_GROUP_STATUS.LOCKED;
  if (source.status !== SOURCE_STATUS.OK) return SEARCH_GROUP_STATUS.UNAVAILABLE;
  return undefined;
};

export const readLastSelectionsSource = (): string | null => {
  try {
    return window.localStorage.getItem(LAST_SELECTIONS_SOURCE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeLastSelectionsSource = (sourceId: string) => {
  try {
    window.localStorage.setItem(LAST_SELECTIONS_SOURCE_STORAGE_KEY, sourceId);
  } catch {
    // localStorage может быть недоступен (приватный режим) — выбор просто не запомнится.
  }
};

/** Какой источник открыть: из адреса, иначе последний выбранный, иначе первый. Источник не из
 *  списка (выключен, неизвестен) пропускается. */
export const resolveSelectionsSourceId = (
  sources: Source[],
  requested: string | null,
): string | undefined => {
  const isListed = (id: string | null): id is string =>
    id !== null && sources.some((source) => source.id === id);
  if (isListed(requested)) return requested;
  const last = readLastSelectionsSource();
  if (isListed(last)) return last;
  return sources[0]?.id;
};
