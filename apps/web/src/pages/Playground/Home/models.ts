import type { EnumLiteralsOf, Source, Title } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Тайтл в «Продолжить чтение»: снимок из `reading_progress` и последняя прочитанная глава. */
export type ContinueItem = {
  title: Title;
  chapterNumber: string | null;
  chapterTitle: string | null;
  /** Время последнего чтения — уже словами, как `formatRelative`. */
  readAgo: string;
};

/** Блок с главной сайта: название — как у сайта. */
export type HomeBlock = {
  id: string;
  title: string;
  items: Title[];
};

/** Секция источника на главной. */
export type HomeSource = {
  source: Source;
  blocks: HomeBlock[];
};

/** Ось C — вид карточки «Продолжить чтение». */
export const CONTINUE_CARD = {
  /** C1 — узкая, как в ленте подборок. */
  NARROW: 'narrow',
  /** C2 — широкая, обложка слева. */
  WIDE: 'wide',
  /** C3 — узкая, глава плашкой на обложке. */
  COVER_CHAPTER: 'coverChapter',
  /** C4 — первая крупная, остальные узкие. */
  HERO: 'hero',
  /** C1 по оговорке к выбору — мета-строка над названием, как у `TitleGridCard`. */
  META_FIRST: 'metaFirst',
} as const;
export type ContinueCard = EnumLiteralsOf<typeof CONTINUE_CARD>;

/** Ось S — как отделены источник и блоки внутри него. */
export const SECTION_STEP = {
  /** S1 — как в поиске, заголовок блока мелким. */
  PLAIN: 'plain',
  /** S2 — блоки вкладками, лента одна. */
  TABS: 'tabs',
  /** S3 — блоки отбиты слева линией цвета источника. */
  COLOR_LINE: 'colorLine',
  /** S4 — вся секция на подложке. */
  PAPER: 'paper',
  /** S2a — `SegmentedControl`. */
  TABS_SEGMENTED: 'tabsSegmented',
  /** S2b — текстовые вкладки, как на сайтах. */
  TABS_TEXT: 'tabsText',
  /** S2c — дропдаун в строке заголовка. */
  TABS_SELECT: 'tabsSelect',
  /** S2d — стрелки ‹ › у названия блока. */
  TABS_ARROWS: 'tabsArrows',
  /** S2e — чипы со счётчиком у активного. */
  TABS_COUNT: 'tabsCount',
} as const;
export type SectionStep = EnumLiteralsOf<typeof SECTION_STEP>;

/** Ось K — короткие блоки (до пяти тайтлов). */
export const SHORT_BLOCKS = {
  /** K1 — та же лента. */
  RIBBON: 'ribbon',
  /** K2 — соседние короткие блоки в один ряд. */
  SIDE_BY_SIDE: 'sideBySide',
} as const;
export type ShortBlocks = EnumLiteralsOf<typeof SHORT_BLOCKS>;

/** Сколько тайтлов в блоке ещё считается коротким блоком для K2. */
export const SHORT_BLOCK_MAX = 5;

/** Ось L — ссылка в каталог источника. */
export const CATALOG_LINK = {
  /** L1 — «Каталог →» справа. */
  RIGHT: 'right',
  /** L2 — название источника само ссылка. */
  TITLE: 'title',
  /** L3 — и то и другое. */
  BOTH: 'both',
} as const;
export type CatalogLink = EnumLiteralsOf<typeof CATALOG_LINK>;

/** Ось A — где «Все источники». */
export const ALL_SOURCES_PLACE = {
  /** A1 — кнопка у заголовка страницы. */
  PAGE_TITLE: 'pageTitle',
  /** A2 — строка над подборками. */
  ABOVE_SECTIONS: 'aboveSections',
  /** A3 — без заголовка страницы, ссылка в строке над подборками. */
  NO_PAGE_TITLE: 'noPageTitle',
} as const;
export type AllSourcesPlace = EnumLiteralsOf<typeof ALL_SOURCES_PLACE>;

/** Ось H — кнопка «Главная» в шапке на десктопе. */
export const HEADER_HOME = {
  /** H0 — как сейчас: только логотип. */
  NONE: 'none',
  /** H1 — домик справа, первым перед закладками. */
  ICON_RIGHT: 'iconRight',
  /** H2 — кнопка с подписью слева. */
  BUTTON_LEFT: 'buttonLeft',
  /** H3 — домик слева. */
  ICON_LEFT: 'iconLeft',
  /** H4 — пункты навигации с подчёркиванием. */
  TABS: 'tabs',
} as const;
export type HeaderHome = EnumLiteralsOf<typeof HEADER_HOME>;

/** Какая страница открыта в макете шапки и нижней панели. */
export const MOCK_PAGE = {
  HOME: 'home',
  CATALOG: 'catalog',
  BOOKMARKS: 'bookmarks',
  NOTIFICATIONS: 'notifications',
} as const;
export type MockPage = EnumLiteralsOf<typeof MOCK_PAGE>;

/** Подварианты H3 — как выделена активная иконка шапки: главная, закладки, уведомления. */
export const HEADER_HIGHLIGHT = {
  /** H3a — светлая подложка и залитая иконка. */
  LIGHT: 'light',
  /** H3b — только акцентный цвет и заливка. */
  FILL: 'fill',
  /** H3c — акцентная линия по низу шапки. */
  LINE: 'line',
} as const;
export type HeaderHighlight = EnumLiteralsOf<typeof HEADER_HIGHLIGHT>;

/** P5 — общий вид блока, в который сводятся блоки всех сайтов. */
export const HOME_KIND = {
  NEW: 'new',
  POPULAR: 'popular',
  UPDATES: 'updates',
} as const;
export type HomeKind = EnumLiteralsOf<typeof HOME_KIND>;

/** P3 — чем выбирать источник, когда на главной один источник за раз. */
export const SOURCE_PICKER = {
  /** P3a — чипы с логотипами. */
  CHIPS: 'chips',
  /** P3b — кнопка со списком, как выбор источника в шапке. */
  SELECT: 'select',
  /** P3c — круглые логотипы без подписей. */
  LOGOS: 'logos',
} as const;
export type SourcePicker = EnumLiteralsOf<typeof SOURCE_PICKER>;

/** P4 — как с главной попасть в подборки, когда они живут отдельно. */
export const SELECTIONS_ENTRY = {
  /** P4a — карточки источников → страница подборок. */
  CARDS: 'cards',
  /** P4b — одна строка-ссылка → страница подборок. */
  LINK: 'link',
  /** P4c — карточки источников → вкладка «Главная сайта» на каталоге. */
  CATALOG_TAB: 'catalogTab',
} as const;
export type SelectionsEntry = EnumLiteralsOf<typeof SELECTIONS_ENTRY>;

/** Ось V — как с главной P4a попасть в подборки и во все источники, не путая одно с другим. */
export const HOME_ENTRIES = {
  /** V1 — два блока со своими заголовками и крупными кнопками. */
  BLOCKS: 'blocks',
  /** V2 — две большие плитки под «Продолжить». */
  TILES: 'tiles',
  /** V2a — только две плитки, без карточек источников. */
  TILES_ONLY: 'tilesOnly',
  /** V2b — логотипы источников внутри плитки «Подборки», без карточек. */
  TILES_LOGOS: 'tilesLogos',
  /** V2c — плитка «Источники» и карточки источников вместо плитки «Подборки». */
  SOURCES_TILE: 'sourcesTile',
  /** V3 — плитка «Все подборки» последней в сетке, «Все источники» у заголовка ярче. */
  TRAILING_TILE: 'trailingTile',
  /** V4 — заголовки-ссылки и плашка «Каталоги всех источников» внизу. */
  LINK_HEADINGS: 'linkHeadings',
} as const;
export type HomeEntries = EnumLiteralsOf<typeof HOME_ENTRIES>;

/** Ось W — чем наполнить главную V2a и в каком виде. */
export const HOME_FILL = {
  /** W1 — все блоки лентами обложек. */
  RIBBONS: 'ribbons',
  /** W2 — у каждого блока своя форма. */
  MIXED: 'mixed',
  /** W3 — зоны «Моё» и «Новое на сайтах». */
  ZONES: 'zones',
} as const;
export type HomeFill = EnumLiteralsOf<typeof HOME_FILL>;

/** Ось T — вид вкладки «Главная» в настройках. */
export const SETTINGS_LAYOUT = {
  /** T1 — блоки раскрыты сразу. */
  EXPANDED: 'expanded',
  /** T2 — блоки по раскрытию. */
  COLLAPSIBLE: 'collapsible',
  /** T3 — блоки в `CompactMultiSelect`. */
  MULTISELECT: 'multiselect',
  /** T4 — только галочки, без переключателя источника. */
  CHECKBOXES: 'checkboxes',
} as const;
export type SettingsLayout = EnumLiteralsOf<typeof SETTINGS_LAYOUT>;

/** Раскладка галочек блоков в T1. */
export const SETTINGS_BLOCKS = {
  /** T1 — строкой с переносом. */
  WRAP: 'wrap',
  /** T1a — одной колонкой. */
  COLUMN: 'column',
  /** T1b — сеткой: 2 колонки на телефоне, 3 на десктопе. */
  GRID: 'grid',
} as const;
export type SettingsBlocks = EnumLiteralsOf<typeof SETTINGS_BLOCKS>;

/** Выбор во вкладке настроек: хранятся выключенное, как в плане. */
export type HomeSettingsState = {
  disabledSources: string[];
  /** `sourceId:blockId`. */
  disabledBlocks: string[];
};

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранная комбинация' }] },
  {
    title: 'Устройство',
    axes: [
      { letter: 'P', title: 'Устройство страницы' },
      { letter: 'V', title: 'Входы с главной' },
      { letter: 'W', title: 'Наполнение главной' },
    ],
  },
  {
    title: 'Продолжить чтение',
    axes: [
      { letter: 'C', title: 'Карточка' },
      { letter: 'U', title: 'Убрать' },
    ],
  },
  {
    title: 'Подборки',
    axes: [
      { letter: 'S', title: 'Источник и блоки' },
      { letter: 'S2', title: 'Переключение блоков' },
      { letter: 'K', title: 'Короткий блок' },
      { letter: 'L', title: 'Ссылка в каталог' },
      { letter: 'Z', title: 'Скелетон' },
    ],
  },
  {
    title: 'Навигация',
    axes: [
      { letter: 'A', title: 'Все источники' },
      { letter: 'H', title: 'Шапка' },
      { letter: 'B', title: 'Нижняя панель' },
    ],
  },
  {
    title: 'Настройки и пусто',
    axes: [
      { letter: 'T', title: 'Вкладка настроек' },
      { letter: 'E', title: 'Пустая главная' },
    ],
  },
];
