import { createContext, type ReactNode } from 'react';
import {
  SEARCH_GROUP_STATUS,
  TITLE_STATE,
  TITLE_TYPE,
  VIEW_MODE,
  type EnumLiteralsOf,
  type Source,
  type Title,
  type TitleState,
  type TitleType,
  type ViewMode,
} from '@tanuki/contracts';

/** `SEARCH_GROUP_STATUS` с будущим значением из плана: источник degraded/down, веер его не
 *  опрашивал. В контракты оно попадёт при реализации — макет его только имитирует. */
export const MOCK_GROUP_STATUS = {
  ...SEARCH_GROUP_STATUS,
  UNAVAILABLE: 'unavailable',
} as const;
export type MockGroupStatus = EnumLiteralsOf<typeof MOCK_GROUP_STATUS>;

export type MissStatus = Exclude<MockGroupStatus, typeof MOCK_GROUP_STATUS.OK>;

/** Источник, где что-то нашлось. */
export type FoundGroup = {
  source: Source;
  items: Title[];
};

/** Источник из строки «Не ответили». */
export type MissedGroup = {
  source: Source;
  status: MissStatus;
};

export type SearchFilters = {
  sources: string[];
  types: TitleType[];
  states: TitleState[];
};

export const EMPTY_FILTERS: SearchFilters = { sources: [], types: [], states: [] };

/** С чего начинают живые фильтры оси F — чтобы пилюли были видны сразу. */
export const PRESET_FILTERS: SearchFilters = {
  sources: [],
  types: [TITLE_TYPE.MANHWA, TITLE_TYPE.MANHUA],
  states: [TITLE_STATE.ONGOING],
};

/** Ось L — как разложены карточки секции. */
export const CARD_LAYOUT = {
  /** L0 — сетка с переносом 2/3/5. */
  WRAP: 'wrap',
  /** L1 — горизонтальная лента на любой ширине. */
  RIBBON: 'ribbon',
  /** L2 — сетка на десктопе, лента на телефоне. */
  RIBBON_ON_PHONE: 'ribbonOnPhone',
  /** L3 — один ряд сетки, остальное раскрывается. */
  ONE_ROW: 'oneRow',
  /** L4 — плотная сетка 6/3, список в две колонки. */
  DENSE: 'dense',
  /** L1s — лента L1 на Mantine `Scroller`: стрелки по краям и перетаскивание мышью. */
  SCROLLER: 'scroller',
} as const;
export type CardLayout = EnumLiteralsOf<typeof CARD_LAYOUT>;

/** Ось D — где крестик удаления у недавнего запроса. */
export const REMOVE_VISIBILITY = {
  HOVER: 'hover',
  ALWAYS: 'always',
} as const;
export type RemoveVisibility = EnumLiteralsOf<typeof REMOVE_VISIBILITY>;

/** Сетка или список — общий на всю страницу песочницы, как `viewMode` пользователя в приложении. */
export const VIEW_MODE_CONTEXT = createContext<{
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}>({ viewMode: VIEW_MODE.GRID, setViewMode: () => {} });

/** Вариант на оси: код, идея, цена и сам макет — уже в рамках десктопа и телефона. */
export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  render: () => ReactNode;
};

/** Группа фильтров поиска — как `FilterGroup` каталога, но значения лежат в `SearchFilters`. */
export type SearchFilterGroup = {
  key: keyof SearchFilters;
  title: string;
  options: { value: string; label: string }[];
};

/** Ось G — где вид карточек относительно «Фильтров» на десктопе. */
export const TOOLBAR_LAYOUT = {
  /** G3 — как в каталоге: вид у правого края, пилюли строкой ниже. */
  CATALOG: 'catalog',
  /** G1 — вид сразу за «Фильтрами». */
  NEXT_TO_FILTERS: 'nextToFilters',
  /** G2 — «Фильтры», пилюли, вид у правого края — одной строкой. */
  PILLS_BETWEEN: 'pillsBetween',
} as const;
export type ToolbarLayout = EnumLiteralsOf<typeof TOOLBAR_LAYOUT>;

/** Ось M — строка «Фильтры» и вида на телефоне. */
export const PHONE_TOOLBAR = {
  /** Как в каталоге: кнопка во всю ширину, вид отдельной строкой под пилюлями. */
  SEPARATE_ROW: 'separateRow',
  /** M1 — кнопка растянута, вид справа в той же строке. */
  FILTERS_GROW: 'filtersGrow',
  /** M2 — обе по своей ширине, по краям строки. */
  SPACE_BETWEEN: 'spaceBetween',
} as const;
export type PhoneToolbar = EnumLiteralsOf<typeof PHONE_TOOLBAR>;

/** Ось C — как выглядят чипы «Нашлось на:». */
export const ANCHOR_STYLE = {
  /** H6c — кнопки со скруглением `xl`. */
  ROUND: 'round',
  /** C1 — кнопки с обычным скруглением. */
  DEFAULT: 'default',
  /** C2 — бейджи `muted` без рамки. */
  BADGE: 'badge',
  /** C3 — пилюли `muted`, как у фильтров. */
  PILL: 'pill',
} as const;
export type AnchorStyle = EnumLiteralsOf<typeof ANCHOR_STYLE>;

/** Ось R — чем разделены секции источников. */
export const SECTION_SEPARATOR = {
  NONE: 'none',
  /** R1 — тонкая линия. */
  DIVIDER: 'divider',
  /** R2 — линия и отступ `xl` с обеих сторон. */
  DIVIDER_WIDE: 'dividerWide',
  /** R3 — подложка без рамки. */
  SURFACE: 'surface',
} as const;
export type SectionSeparator = EnumLiteralsOf<typeof SECTION_SEPARATOR>;

/** Что меняют доработки итога; каждая ось трогает одно поле. */
export type SummaryConfig = {
  toolbarLayout: ToolbarLayout;
  phoneToolbar: PhoneToolbar;
  anchorStyle: AnchorStyle;
  /** Сколько карточек видно в виде «список» до «Показать ещё»; null — все. */
  listPreview: number | null;
  /** N5 — раскрытый «Не ответили» строками как в N4. */
  withMissedRows: boolean;
  sectionSeparator: SectionSeparator;
};

/** Итог первого выбора (H6c + S1 + L1s + N3 + D2 + E5 + F6) — от него считаются доработки. */
export const BASE_SUMMARY_CONFIG: SummaryConfig = {
  toolbarLayout: TOOLBAR_LAYOUT.CATALOG,
  phoneToolbar: PHONE_TOOLBAR.SEPARATE_ROW,
  anchorStyle: ANCHOR_STYLE.ROUND,
  listPreview: null,
  withMissedRows: false,
  sectionSeparator: SECTION_SEPARATOR.NONE,
};

/** Итог после доработок: G3 + M1 + C1 + V1 + N5 + R2. */
export const FINAL_SUMMARY_CONFIG: SummaryConfig = {
  toolbarLayout: TOOLBAR_LAYOUT.CATALOG,
  phoneToolbar: PHONE_TOOLBAR.FILTERS_GROW,
  anchorStyle: ANCHOR_STYLE.DEFAULT,
  listPreview: 3,
  withMissedRows: true,
  sectionSeparator: SECTION_SEPARATOR.DIVIDER_WIDE,
};
