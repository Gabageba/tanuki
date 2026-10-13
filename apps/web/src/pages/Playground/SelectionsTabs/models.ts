import type { EnumLiteralsOf, Source, Title } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Вид блока по смыслу — из него иконка вкладки. При реализации ляжет в описание блока парсера
 *  (`homeSections: { id; title; kind }`), здесь — своя копия. */
export const BLOCK_KIND = {
  NEW: 'new',
  TRENDING: 'trending',
  POPULAR: 'popular',
  TOP: 'top',
  UPDATES: 'updates',
} as const;
export type BlockKind = EnumLiteralsOf<typeof BLOCK_KIND>;

/** Блок главной сайта. `pageSize` — сколько тайтлов приходит за раз; `pages` — сколько порций
 *  у сайта есть всего (1 — у блока нет продолжения: HTML-главная, слайдер). */
export type MockBlock = {
  id: string;
  title: string;
  kind: BlockKind;
  pageSize: number;
  pages: number;
  /** У блока на сайте есть выбор периода — «Сейчас читают» MangaLib (`/media/top-views?time=`). */
  hasPeriod?: boolean;
  /** P3 — блок собран из нескольких: что показать внутри него (новинки / набирающее / популярное). */
  variants?: { id: string; title: string }[];
};

/** Период «Сейчас читают» — как у сайта: `time=day|week|month`. */
export const READING_PERIOD = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;
export type ReadingPeriod = EnumLiteralsOf<typeof READING_PERIOD>;

/** Ось P — где выбирается период. */
export const PERIOD_PICKER = {
  /** P0 — периода нет, как сейчас. */
  NONE: 'none',
  /** P1 — `SegmentedControl` над сеткой. */
  SEGMENTED: 'segmented',
  /** P2 — `Select` в строке «Каталог / вид». */
  SELECT: 'select',
  /** P3 — одна вкладка «Сейчас читают», внутри что и за какой период. */
  MERGED: 'merged',
} as const;
export type PeriodPicker = EnumLiteralsOf<typeof PERIOD_PICKER>;

export type MockSelectionsSource = {
  source: Source;
  blocks: MockBlock[];
};

/** Ось S — чем выбирается источник. */
export const SOURCE_PICKER = {
  /** S0 — чипы, как сейчас. */
  CHIPS: 'chips',
  /** S1 — `Select` с логотипами и поиском. */
  SELECT: 'select',
  /** S2 — заголовок источника сам кнопка со списком. */
  TITLE_MENU: 'titleMenu',
  /** S3 — кнопка открывает drawer с сеткой плиток. */
  DRAWER: 'drawer',
} as const;
export type SourcePicker = EnumLiteralsOf<typeof SOURCE_PICKER>;

/** Ось M — где стоит выбор источника. */
export const PICKER_PLACEMENT = {
  /** M1 — своей строкой под заголовком страницы, «Каталог» и вид справа. */
  BELOW_TITLE: 'belowTitle',
  /** M2 — справа в строке заголовка «Подборки». */
  IN_TITLE: 'inTitle',
  /** M3 — в одной строке с вкладками. */
  WITH_TABS: 'withTabs',
} as const;
export type PickerPlacement = EnumLiteralsOf<typeof PICKER_PLACEMENT>;

/** Ось T — вид вкладок блоков. */
export const TABS_LOOK = {
  /** T1 — подчёркивание, как в закладках. */
  UNDERLINE: 'underline',
  /** T2 — пилюли. */
  PILLS: 'pills',
} as const;
export type TabsLook = EnumLiteralsOf<typeof TABS_LOOK>;

/** Ось E — как видно, что у блока нет продолжения. */
export const BLOCK_END = {
  /** E1 — строка внизу. */
  NOTE: 'note',
  /** E2 — строка и ссылка в каталог. */
  NOTE_CATALOG: 'noteCatalog',
  /** E3 — число тайтлов на вкладке конечного блока и строка внизу. */
  TAB_COUNT: 'tabCount',
  /** E4 — разделитель с подписью. */
  DIVIDER: 'divider',
} as const;
export type BlockEnd = EnumLiteralsOf<typeof BLOCK_END>;

/** Ось F — следующая порция не загрузилась. */
export const NEXT_PAGE_ERROR = {
  /** F0 — как в каталоге: только тост глобального обработчика. */
  TOAST_ONLY: 'toastOnly',
  /** F1 — строка с причиной и «Повторить загрузку». */
  RETRY_ROW: 'retryRow',
  /** F2 — кнопка «Загрузить ещё» на месте подгрузки. */
  LOAD_MORE: 'loadMore',
  /** F1 в итоге — та же строка, но общими словами: живёт в `PageLayout.InfiniteScrollTrigger`
   *  и работает в каталоге, уведомлениях и подборках. */
  RETRY_ROW_LIST: 'retryRowList',
} as const;
export type NextPageError = EnumLiteralsOf<typeof NEXT_PAGE_ERROR>;

/** Z1 — источник с одним блоком. */
export const SINGLE_BLOCK = {
  /** Z1a — одна вкладка остаётся. */
  TAB: 'tab',
  /** Z1b — вкладок нет, вместо них название блока. */
  LABEL: 'label',
} as const;
export type SingleBlock = EnumLiteralsOf<typeof SINGLE_BLOCK>;

/** Ось C — как выглядит переход в каталог источника. */
export const CATALOG_LINK = {
  /** C0 — `ArrowLink` «Каталог: Реманга» справа, как сейчас. */
  ARROW: 'arrow',
  /** C1 — «Каталог» мелким серым текстом, без стрелки. */
  QUIET: 'quiet',
  /** C2 — иконка книг с подсказкой рядом с видом. */
  ICON: 'icon',
  /** C3 — ссылка во второй строке заголовка, рядом с доменом. */
  SUBTITLE: 'subtitle',
  /** C4 — пункт в меню источника. */
  MENU: 'menu',
} as const;
export type CatalogLink = EnumLiteralsOf<typeof CATALOG_LINK>;

/** Ось H — панель над сеткой: фильтры блока, вид и кнопка каталога в одной строке. */
export const LIST_PANEL = {
  /** Панели нет — каталог и вид в строке источника, как в C0–C4. */
  NONE: 'none',
  /** H1 — панель, кнопка «Каталог» высотой с переключатели (`sm`). */
  BUTTON_SM: 'buttonSm',
  /** H2 — панель, кнопка `xs` «Каталог: Реманга», как L4. */
  BUTTON_XS: 'buttonXs',
  /** H3 — кнопка `xs` в строке источника, в панели только фильтры и вид. */
  HEADER_BUTTON: 'headerButton',
  /** Прежний итог — H3, но каталог в строке источника ссылкой (`ArrowLink` «Каталог»). */
  HEADER_LINK: 'headerLink',
  /** Итог — H3 с короткой кнопкой «Каталог»; на телефоне период растянут на всю ширину, вид —
   *  справа в той же строке. */
  HEADER_SHORT_BUTTON: 'headerShortButton',
} as const;
export type ListPanel = EnumLiteralsOf<typeof LIST_PANEL>;

/** Вид страницы по всем осям сразу. */
export type SelectionsLook = {
  picker: SourcePicker;
  placement: PickerPlacement;
  tabs: TabsLook;
  end: BlockEnd;
  nextPageError: NextPageError;
  singleBlock: SingleBlock;
  period: PeriodPicker;
  catalog: CatalogLink;
  panel: ListPanel;
};

/** От чего отталкиваются оси: каждая меняет у этого набора только своё. */
export const BASE_LOOK: SelectionsLook = {
  picker: SOURCE_PICKER.TITLE_MENU,
  placement: PICKER_PLACEMENT.BELOW_TITLE,
  tabs: TABS_LOOK.UNDERLINE,
  end: BLOCK_END.NOTE,
  nextPageError: NEXT_PAGE_ERROR.RETRY_ROW,
  singleBlock: SINGLE_BLOCK.TAB,
  period: PERIOD_PICKER.NONE,
  catalog: CATALOG_LINK.ARROW,
  panel: LIST_PANEL.NONE,
};

/** Промежуточный итог до выбора H и P — на нём построены оси C, H и P: каталог и вид в строке
 *  источника, период — переключателем над сеткой (P1). */
export const DRAFT_LOOK: SelectionsLook = {
  ...BASE_LOOK,
  end: BLOCK_END.NOTE_CATALOG,
  nextPageError: NEXT_PAGE_ERROR.RETRY_ROW_LIST,
  period: PERIOD_PICKER.SEGMENTED,
};

/** Выбранная комбинация: R1 + S2 + M1 + T1 + E2 + F1 (общими словами) + Z1a + H3 (кнопка
 *  «Каталог») + P2 (период полем в панели над сеткой). */
export const FINAL_LOOK: SelectionsLook = {
  ...BASE_LOOK,
  end: BLOCK_END.NOTE_CATALOG,
  nextPageError: NEXT_PAGE_ERROR.RETRY_ROW_LIST,
  period: PERIOD_PICKER.SELECT,
  panel: LIST_PANEL.HEADER_SHORT_BUTTON,
};

/** Застывшее состояние открытого блока — для показа рядом; `live` — листается по-настоящему. */
export const FEED_STATE = {
  LIVE: 'live',
  LOADING: 'loading',
  LOADING_MORE: 'loadingMore',
  END: 'end',
  NEXT_PAGE_ERROR: 'nextPageError',
  EMPTY: 'empty',
} as const;
export type FeedState = EnumLiteralsOf<typeof FEED_STATE>;

/** Порция блока, как её отдаст `GET /selections/:sourceId/:sectionId?page=`. */
export type MockFeed = {
  items: Title[];
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isNextPageFailed: boolean;
};

/** Сколько ждёт мок перед ответом — чтобы подгрузка была видна. */
export const MOCK_DELAY_MS = 900;

/** Высота окна, в котором листается живой вариант: страница песочницы длинная, и бесконечная
 *  прокрутка всей страницы растягивала бы её на каждом проходе мимо варианта. */
export const LIVE_FRAME_HEIGHT = 640;

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранная комбинация' }] },
  { title: 'Раскладка', axes: [{ letter: 'R', title: 'Что вкладки, что селектор' }] },
  {
    title: 'Источник',
    axes: [
      { letter: 'S', title: 'Форма селектора' },
      { letter: 'M', title: 'Место селектора' },
      { letter: 'C', title: 'Переход в каталог' },
      { letter: 'H', title: 'Панель над сеткой' },
    ],
  },
  {
    title: 'Блок',
    axes: [
      { letter: 'T', title: 'Вид вкладок' },
      { letter: 'E', title: 'Блок без продолжения' },
      { letter: 'F', title: 'Ошибка подгрузки' },
      { letter: 'P', title: 'Период «Сейчас читают»' },
    ],
  },
  { title: 'Состояния', axes: [{ letter: 'Z', title: 'Загрузка, пусто, ошибки' }] },
];
