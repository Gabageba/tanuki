import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Состояния скачивания из плана docs/plans/offline-downloads.md — в `entities/download` они появятся
 *  при реализации, поэтому макет держит свою копию. Нет записи → `null`, «не скачана». */
export const DOWNLOAD_STATUS = {
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  DONE: 'done',
  FAILED: 'failed',
} as const;
export type DownloadStatus = EnumLiteralsOf<typeof DOWNLOAD_STATUS>;

export const DOWNLOAD_ERROR = {
  NETWORK: 'network',
  SOURCE: 'source',
  QUOTA: 'quota',
} as const;
export type DownloadError = EnumLiteralsOf<typeof DOWNLOAD_ERROR>;

/** Что пользователь сделал с главой в строке списка. */
export const CHAPTER_ACTION = {
  DOWNLOAD: 'download',
  CANCEL: 'cancel',
  DELETE: 'delete',
  RETRY: 'retry',
} as const;
export type ChapterAction = EnumLiteralsOf<typeof CHAPTER_ACTION>;

export type MockChapter = {
  id: string;
  number: number;
  title: string | null;
  date: string;
  status: DownloadStatus | null;
  error?: DownloadError;
  pagesDone: number;
  pagesTotal: number;
  /** Объём скачанного в мегабайтах. */
  sizeMb: number;
  /** Скачанная глава пропала у источника — копия осталась. */
  isMissingAtSource?: boolean;
};

export type MockDownloadedTitle = {
  id: string;
  name: string;
  source: string;
  coverSeed: string;
  chapters: MockChapter[];
};

export type MockQueueItem = {
  id: string;
  titleName: string;
  chapterLabel: string;
  status: DownloadStatus;
  error?: DownloadError;
  pagesDone: number;
  pagesTotal: number;
};

/** C — иконка состояния в строке главы. */
export const CHAPTER_ICON = {
  LEGACY: 'legacy',
  BUTTON: 'button',
  COUNTER: 'counter',
  NUMBER_MARK: 'numberMark',
  BAR: 'bar',
} as const;
export type ChapterIcon = EnumLiteralsOf<typeof CHAPTER_ICON>;

/** D — не скачанная глава без сети. */
export const OFFLINE_ROW = {
  DIMMED: 'dimmed',
  DIMMED_ICON: 'dimmedIcon',
} as const;
export type OfflineRow = EnumLiteralsOf<typeof OFFLINE_ROW>;

/** B — плашка на тайтле. */
export const PLATE = {
  LEGACY: 'legacy',
  LINE: 'line',
  BUTTON: 'button',
  CARD: 'card',
  META: 'meta',
} as const;
export type Plate = EnumLiteralsOf<typeof PLATE>;

export const PLATE_STATE = {
  DONE: 'done',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  FAILED: 'failed',
} as const;
export type PlateState = EnumLiteralsOf<typeof PLATE_STATE>;

/** M — как в модалке выбирают, что скачать. */
export const MODAL_PICKER = {
  SEGMENTED: 'segmented',
  RADIO: 'radio',
  PRESETS: 'presets',
} as const;
export type ModalPicker = EnumLiteralsOf<typeof MODAL_PICKER>;

export const DOWNLOAD_SCOPE = {
  ALL: 'all',
  UNREAD: 'unread',
  RANGE: 'range',
} as const;
export type DownloadScope = EnumLiteralsOf<typeof DOWNLOAD_SCOPE>;

/** Q — перестановка в очереди. */
export const QUEUE_REORDER = {
  MENU: 'menu',
  DRAG: 'drag',
} as const;
export type QueueReorder = EnumLiteralsOf<typeof QUEUE_REORDER>;

/** Состояние очереди, общее для вариантов Q (переключатель песочницы). */
export const QUEUE_STATE = {
  RUNNING: 'running',
  PAUSED: 'paused',
  QUOTA: 'quota',
} as const;
export type QueueState = EnumLiteralsOf<typeof QUEUE_STATE>;

/** L — раскладка скачанного. */
export const DOWNLOADED_LAYOUT = {
  ACCORDION: 'accordion',
  GRID: 'grid',
  MASTER_DETAIL: 'masterDetail',
  TABS: 'tabs',
} as const;
export type DownloadedLayout = EnumLiteralsOf<typeof DOWNLOADED_LAYOUT>;

/** N — индикация «Нет сети». */
export const OFFLINE_SIGNAL = {
  ICON: 'icon',
  STRIP: 'strip',
  TOAST: 'toast',
  MUTED_HEADER: 'mutedHeader',
  STRIP_STRONG: 'stripStrong',
  STRIP_NEUTRAL: 'stripNeutral',
  CAPSULE: 'capsule',
  HEADER_BADGE: 'headerBadge',
  TAB_GOLD: 'tabGold',
  TAB_INVERTED: 'tabInverted',
  TAB_ACCENT: 'tabAccent',
  TAB_CENTER: 'tabCenter',
  TAB_ACCENT_NO_LINE: 'tabAccentNoLine',
  TAB_ACCENT_FILL: 'tabAccentFill',
  TAB_ACCENT_LINE: 'tabAccentLine',
  TAB_ACCENT_HEADER: 'tabAccentHeader',
  SEARCH: 'search',
  DOWNLOADS_BUTTON: 'downloadsButton',
  SNACKBAR: 'snackbar',
  AVATAR_STATUS: 'avatarStatus',
  STRIP_HEADER: 'stripHeader',
  /** N2a — N2 с текстом обычного цвета и кнопкой «Загрузки» muted. */
  STRIP_BUTTON: 'stripButton',
  /** N2b–N2d — N2a со ссылкой «Загрузки» вместо кнопки: золотом, акцентом, цветом текста. */
  STRIP_LINK_GOLD: 'stripLinkGold',
  STRIP_LINK_ACCENT: 'stripLinkAccent',
  STRIP_LINK_TEXT: 'stripLinkText',
} as const;
export type OfflineSignal = EnumLiteralsOf<typeof OFFLINE_SIGNAL>;

/** K — каталог без сети. */
export const OFFLINE_CATALOG = {
  /** Итог: без заметки и без смены заголовка — объясняет полоса N2. */
  PLAIN: 'plain',
  NOTE: 'note',
  HEADING: 'heading',
  DISABLED_FILTERS: 'disabledFilters',
} as const;
export type OfflineCatalog = EnumLiteralsOf<typeof OFFLINE_CATALOG>;

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранная комбинация' }] },
  {
    title: 'Тайтл и список глав',
    axes: [
      { letter: 'C', title: 'Строка главы' },
      { letter: 'D', title: 'Глава без сети' },
      { letter: 'B', title: 'Плашка на тайтле' },
      { letter: 'M', title: 'Модалка «Скачать главы»' },
    ],
  },
  {
    title: 'Загрузки',
    axes: [
      { letter: 'Q', title: 'Очередь' },
      { letter: 'L', title: 'Скачанные тайтлы' },
      { letter: 'E', title: 'Пустые состояния' },
      { letter: 'P', title: 'Строка в профиле' },
      { letter: 'S', title: 'Вкладка настроек' },
    ],
  },
  {
    title: 'Без сети',
    axes: [
      { letter: 'N', title: 'Индикация' },
      { letter: 'U', title: 'Недоступно без сети' },
      { letter: 'K', title: 'Каталог и поиск' },
    ],
  },
  {
    title: 'Приложение',
    axes: [
      { letter: 'T', title: 'Доступно обновление' },
      { letter: 'I', title: 'Установка' },
      { letter: 'H', title: 'Подсказка iOS' },
    ],
  },
];

export type DownloadFormValues = {
  scope: DownloadScope;
  from: number | string;
  to: number | string;
};

/** P — строка «Удалить скачанные главы» в «Профиль → Данные». */
export const PROFILE_ROW = {
  LEGACY: 'legacy',
  SINGLE: 'single',
  SPLIT: 'split',
} as const;
export type ProfileRow = EnumLiteralsOf<typeof PROFILE_ROW>;

/** S — вкладка настроек «Загрузки». */
export const SETTINGS_LAYOUT = {
  SINGLE: 'single',
  SPLIT: 'split',
  /** S2a — S2 с полем папок и полосой свободного места на всю ширину строки. */
  SPLIT_WIDE: 'splitWide',
} as const;
export type SettingsLayout = EnumLiteralsOf<typeof SETTINGS_LAYOUT>;

/** U — что видно на месте того, что без сети не открыть. */
export const UNAVAILABLE_PLACE = {
  TITLE: 'title',
  CHAPTER: 'chapter',
} as const;
export type UnavailablePlace = EnumLiteralsOf<typeof UNAVAILABLE_PLACE>;

/** C2a/C2c/C2d — чем строка C2 помечает состояние цветом. */
export const CHAPTER_TINT = {
  /** C2e — значки в насыщенных цветах, как метки C3. */
  ICON: 'icon',
  COUNTER: 'counter',
  BACKGROUND: 'background',
  STRIPE: 'stripe',
} as const;
export type ChapterTint = EnumLiteralsOf<typeof CHAPTER_TINT>;

/** H5, H9–H12 — чем выделен блок «Установите Tanuki на экран Домой» вверху «Загрузок». */
export const IOS_HINT_LOOK = {
  /** H5 — серый, как предложение push. */
  GRAY: 'gray',
  ACCENT: 'accent',
  ICON: 'icon',
  STRIPE: 'stripe',
  GOLD: 'gold',
} as const;
export type IosHintLook = EnumLiteralsOf<typeof IOS_HINT_LOOK>;
