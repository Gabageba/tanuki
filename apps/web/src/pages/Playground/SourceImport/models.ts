import type {
  BookmarkFolderColor,
  BookmarkFolderIcon,
  BuiltInBookmarkFolder,
  EnumLiteralsOf,
} from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Что будет с тайтлом при импорте — по таблице восстановления из копии. */
export const ITEM_STATE = {
  /** Закладки нет — появится. */
  NEW: 'new',
  /** В группе есть подтверждённая копия — добавится как ещё один источник. */
  IN_GROUP: 'inGroup',
  /** Уже в закладках, но в другой папке — вопрос «Оставить мои / Взять из источника». */
  OTHER_FOLDER: 'otherFolder',
  /** Этот же тайтл уже импортирован в ту же папку — в конце группы, снят. */
  IMPORTED: 'imported',
} as const;
export type ItemState = EnumLiteralsOf<typeof ITEM_STATE>;

/** Как папка сайта легла на нашу. */
export const FOLDER_MAPPING = {
  /** Стандартный статус сайта — встроенная папка. */
  BUILT_IN: 'builtIn',
  /** Своя папка сайта совпала по имени с нашей. */
  MATCHED: 'matched',
  /** Своя папка сайта — создастся у нас. */
  CREATED: 'created',
  /** Своих папок больше лимита — тайтлы лягут во «В планах». */
  OVER_LIMIT: 'overLimit',
} as const;
export type FolderMapping = EnumLiteralsOf<typeof FOLDER_MAPPING>;

/** Наша папка, куда лягут тайтлы. */
export type TargetFolder = {
  name: string;
  icon: BookmarkFolderIcon;
  color: BookmarkFolderColor;
};

export type ImportItem = {
  id: string;
  name: string;
  /** «Где остановился» на сайте; null — сайт не отдал. */
  lastChapter: number | null;
  /** Ваша отметка у этого тайтла, если закладка уже есть. */
  myChapter: number | null;
  state: ItemState;
  /** Папка, где тайтл лежит у вас сейчас, — для `OTHER_FOLDER`. */
  currentFolder?: BuiltInBookmarkFolder;
  /** Цвет заглушки обложки в R3. */
  hue: BookmarkFolderColor;
};

export type SiteFolder = {
  id: string;
  name: string;
  mapping: FolderMapping;
  target: TargetFolder;
  items: ImportItem[];
};

/** L — подача групп по папкам сайта. */
export const LIST_VIEW = {
  FLAT: 'flat',
  FRAMES: 'frames',
  ACCORDION: 'accordion',
  SUBHEADERS: 'subheaders',
  DRILL: 'drill',
} as const;
export type ListView = EnumLiteralsOf<typeof LIST_VIEW>;

/** K — где общий счётчик выбранного. */
export const COUNTER_VIEW = {
  TOP: 'top',
  BOTTOM: 'bottom',
  BUTTON: 'button',
} as const;
export type CounterView = EnumLiteralsOf<typeof COUNTER_VIEW>;

/** R — раскладка строки тайтла. */
export const ROW_VIEW = {
  ONE_LINE: 'oneLine',
  TWO_LINES: 'twoLines',
  COVER: 'cover',
} as const;
export type RowView = EnumLiteralsOf<typeof ROW_VIEW>;

/** A — как отличить уже импортированные. */
export const IMPORTED_VIEW = {
  DIMMED_LAST: 'dimmedLast',
  COLLAPSED: 'collapsed',
  BADGE: 'badge',
} as const;
export type ImportedView = EnumLiteralsOf<typeof IMPORTED_VIEW>;

/** P — расхождение отметки в строке. */
export const PROGRESS_VIEW = {
  HIDDEN: 'hidden',
  BOTH: 'both',
} as const;
export type ProgressView = EnumLiteralsOf<typeof PROGRESS_VIEW>;

/** M — где показано сопоставление папок. */
export const MAPPING_VIEW = {
  ROW_BADGE: 'rowBadge',
  GROUP_HEADER: 'groupHeader',
  SUMMARY: 'summary',
} as const;
export type MappingView = EnumLiteralsOf<typeof MAPPING_VIEW>;

/** F — подача шага «Папки»: выбор целыми папками сайта, без списка тайтлов. */
export const FOLDERS_VIEW = {
  LIST: 'list',
  BADGE: 'badge',
  DESTINATION: 'destination',
  CARDS: 'cards',
} as const;
export type FoldersView = EnumLiteralsOf<typeof FOLDERS_VIEW>;

/** Набор решений шага «Тайтлы» — каждая ось меняет своё, остальное берётся из базы. */
export type TitlesConfig = {
  list: ListView;
  counter: CounterView;
  row: RowView;
  imported: ImportedView;
  progress: ProgressView;
  mapping: MappingView;
};

/** База: L1 + K1 + R2 + A1 + P0 + M1 — то, что описано в плане. */
export const BASE_CONFIG: TitlesConfig = {
  list: LIST_VIEW.FRAMES,
  counter: COUNTER_VIEW.TOP,
  row: ROW_VIEW.TWO_LINES,
  imported: IMPORTED_VIEW.DIMMED_LAST,
  progress: PROGRESS_VIEW.HIDDEN,
  mapping: MAPPING_VIEW.ROW_BADGE,
};

/** G — как сказать, что отметки появятся позже. */
export const DONE_VIEW = {
  ROW: 'row',
  NOTE: 'note',
  LOADER: 'loader',
} as const;
export type DoneView = EnumLiteralsOf<typeof DONE_VIEW>;

/** H — кнопка импорта в шапке вошедшей сети. */
export const HEADER_BUTTON = {
  NONE: 'none',
  MUTED: 'muted',
  DEFAULT: 'default',
  SUBTLE: 'subtle',
  ICON: 'icon',
  SHORT_ON_PHONE: 'shortOnPhone',
  ICON_ON_PHONE: 'iconOnPhone',
} as const;
export type HeaderButton = EnumLiteralsOf<typeof HEADER_BUTTON>;

/** E — кнопки в пустых закладках. */
export const EMPTY_ACTIONS = {
  CATALOG_ONLY: 'catalogOnly',
  CATALOG_MAIN: 'catalogMain',
  IMPORT_MAIN: 'importMain',
  BOTH_DEFAULT: 'bothDefault',
  IMPORT_LINK: 'importLink',
  /** Итог: E4, но фраза со ссылкой — продолжением описания, над кнопкой каталога. */
  IMPORT_IN_DESCRIPTION: 'importInDescription',
} as const;
export type EmptyActions = EnumLiteralsOf<typeof EMPTY_ACTIONS>;

/** Высота прокручиваемого списка внутри модалки. */
export const LIST_HEIGHT = 420;

export const SOURCE_TITLE = 'MangaLib';

export const SECTION_GROUPS: SectionNavGroup[] = [
  {
    title: 'Итог',
    axes: [{ letter: 'I', title: 'F1 + S + Q + G3 + H0 + E4' }],
  },
  {
    title: 'Шаг «Папки»',
    axes: [
      { letter: 'F', title: 'Список папок' },
      { letter: 'S', title: 'Состояния' },
    ],
  },
  {
    title: 'Шаг «Тайтлы» · отброшен',
    axes: [
      { letter: 'L', title: 'Группы по папкам сайта' },
      { letter: 'K', title: 'Счётчик выбранного' },
      { letter: 'R', title: 'Строка тайтла' },
      { letter: 'A', title: 'Уже в закладках' },
      { letter: 'P', title: 'Расхождение отметки' },
      { letter: 'M', title: 'Папка сайта → наша' },
      { letter: 'N', title: 'Состояния' },
    ],
  },
  {
    title: 'Шаги после',
    axes: [
      { letter: 'Q', title: 'Вопросы' },
      { letter: 'G', title: 'Готово' },
    ],
  },
  {
    title: 'Точки входа',
    axes: [
      { letter: 'H', title: 'Аккаунты источников' },
      { letter: 'E', title: 'Пустые закладки' },
    ],
  },
];
