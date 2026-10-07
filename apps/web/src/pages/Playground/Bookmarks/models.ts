import type { MantineColor } from '@mantine/core';
import type { EnumLiteralsOf, SourceId } from '@tanuki/contracts';

/** Встроенные папки — ровно четыре, у каждого пользователя (как `BUILT_IN_BOOKMARK_FOLDER` из плана). */
export const BUILT_IN_FOLDER = {
  READING: 'reading',
  PLANNED: 'planned',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;
export type BuiltInFolder = EnumLiteralsOf<typeof BUILT_IN_FOLDER>;

/** Набор иконок для папок — кандидат в `BOOKMARK_FOLDER_ICON`. Первые пять заняты встроенными в I1. */
export const FOLDER_ICON = {
  BOOKMARK: 'bookmark',
  BOOK_OPEN: 'bookOpen',
  CLOCK: 'clock',
  CHECK_CIRCLE: 'checkCircle',
  ARCHIVE: 'archive',
  HEART: 'heart',
  STAR: 'star',
  FIRE: 'fire',
  LIGHTNING: 'lightning',
  CROWN: 'crown',
  SWORD: 'sword',
  GHOST: 'ghost',
  MOON: 'moon',
  LEAF: 'leaf',
  COFFEE: 'coffee',
  SMILEY: 'smiley',
  FLAG: 'flag',
  PUZZLE: 'puzzle',
} as const;
export type FolderIcon = EnumLiteralsOf<typeof FOLDER_ICON>;

/** Цвета своих папок — стандартная палитра Mantine без цветов приложения (terracotta — акцент,
 *  moss/gold/crimson — статусы, amber — рейтинг), чтобы папка не читалась как статус. */
export const FOLDER_COLOR = {
  BLUE: 'blue',
  CYAN: 'cyan',
  TEAL: 'teal',
  LIME: 'lime',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  PINK: 'pink',
  GRAPE: 'grape',
  VIOLET: 'violet',
  INDIGO: 'indigo',
} as const;
export type FolderColor = EnumLiteralsOf<typeof FOLDER_COLOR>;

/** Как оформлены встроенные папки: ось I. */
export const BUILT_IN_STYLE = {
  /** I1 — у каждой своя смысловая иконка. */
  SEMANTIC: 'semantic',
  /** I2 — у всех закладка, различаются цветом. */
  BOOKMARK: 'bookmark',
} as const;
export type BuiltInStyle = EnumLiteralsOf<typeof BUILT_IN_STYLE>;

export const AVAILABILITY = {
  AVAILABLE: 'available',
  SOURCE_DISABLED: 'sourceDisabled',
  SOURCE_DOWN: 'sourceDown',
  TITLE_MISSING: 'titleMissing',
} as const;
export type Availability = EnumLiteralsOf<typeof AVAILABILITY>;

export const SORT = {
  UPDATED: 'updated',
  READ: 'read',
  ADDED: 'added',
  ALPHABETICAL: 'alphabetical',
} as const;
export type Sort = EnumLiteralsOf<typeof SORT>;

/** Ось C — где на карточке закладки счётчик новых глав. */
export const CARD_VARIANT = {
  /** C0 — обычная карточка каталога. */
  CATALOG: 'catalog',
  /** C1 — бейдж на обложке. */
  COVER_BADGE: 'coverBadge',
  /** C2 — в мета-строке. */
  META: 'meta',
  /** C2b — в мета-строке бейджем, как в C3. */
  META_BADGE: 'metaBadge',
  /** C3 — пилюля у названия. */
  TITLE: 'title',
  /** C4 — градиент с прогрессом на обложке, как на MangaLib. */
  COVER_PROGRESS: 'coverProgress',
  /** C5 — фраза «3 новых главы» в мета-строке. */
  PHRASE: 'phrase',
  /** C6 — полоса прогресса под обложкой, новое — акцентный хвост. */
  BOTTOM_BAR: 'bottomBar',
  /** C7 — метка NEW на обложке, число тихим текстом. */
  NEW_TAG: 'newTag',
  /** C8 — карточки с новым собраны в группу сверху; на карточке — фраза, как в C5. */
  GROUPED: 'grouped',
  /** C9 — акцентная рамка вокруг обложки. */
  FRAME: 'frame',
  /** C10 — точка перед названием. */
  TITLE_DOT: 'titleDot',
  /** C10b — точка сразу после последнего слова названия. */
  TITLE_DOT_END: 'titleDotEnd',
  /** C10c — точка у правого края, напротив первой строки. */
  TITLE_DOT_RIGHT: 'titleDotRight',
  /** C10d — точка сразу за коротким названием, у длинного — у правого края. */
  TITLE_DOT_AFTER: 'titleDotAfter',
  /** C10e — точка вплотную за текстом, у обрезанного — за «…». */
  TITLE_DOT_TRAILING: 'titleDotTrailing',
  /** C10h — точка в конце первой строки названия. */
  TITLE_DOT_FIRST_LINE: 'titleDotFirstLine',
  /** C10f — точка слева от названия, на поле, текст не сдвигается. */
  TITLE_DOT_HANGING: 'titleDotHanging',
  /** C10g — точка в мета-строке перед прогрессом. */
  META_DOT: 'metaDot',
  /** C11 — название полужирным. */
  BOLD_TITLE: 'boldTitle',
  /** C12 — «Обновлено вчера» в мета-строке. */
  UPDATED_AGO: 'updatedAgo',
  /** C13 — точка с вырезом на обложке. */
  COVER_DOT: 'coverDot',
  /** C14 — загнутый уголок обложки. */
  CORNER: 'corner',
} as const;
export type CardVariant = EnumLiteralsOf<typeof CARD_VARIANT>;

/** Ось U — вид закладки, у которой не осталось доступных источников. */
export const UNAVAILABLE_VARIANT = {
  /** U1 — приглушена, причина в мета-строке. */
  DIMMED: 'dimmed',
  /** U2 — плашка с причиной на обложке. */
  COVER_PLATE: 'coverPlate',
  /** U3a — серая обложка, лёгкое затемнение с плашкой, приглушённое название. */
  DIMMED_PLATE_LIGHT: 'dimmedPlateLight',
  /** U3b — то же с сильным затемнением. */
  DIMMED_PLATE_STRONG: 'dimmedPlateStrong',
  /** U3c — как U3b, но обложка цветная: сильное затемнение и приглушённое название. */
  PLATE_STRONG: 'plateStrong',
} as const;
export type UnavailableVariant = EnumLiteralsOf<typeof UNAVAILABLE_VARIANT>;

/** Что делается с обложкой недоступной закладки. */
export const COVER_FILTER = {
  /** Серая и бледная. */
  DIMMED: 'dimmed',
  /** Только серая — под плашкой бледность съела бы контраст текста. */
  GRAY: 'gray',
} as const;
export type CoverFilter = EnumLiteralsOf<typeof COVER_FILTER>;

/** Ось T — что во вкладке папки кроме иконки и названия. */
export const TAB_COUNTER = {
  /** T1 — число тайтлов. */
  COUNT: 'count',
  /** T2 — число и точка, если есть новое. */
  COUNT_DOT: 'countDot',
  /** T3 — число и «+N» тайтлов с новыми главами. */
  COUNT_NEW: 'countNew',
} as const;
export type TabCounter = EnumLiteralsOf<typeof TAB_COUNTER>;

/** Ось A — где «Новая папка» и ссылка на настройки. */
export const ACTIONS_PLACEMENT = {
  /** A1 — в конце полосы вкладок. */
  TABS: 'tabs',
  /** A2 — справа в строке поиска. */
  TOOLBAR: 'toolbar',
} as const;
export type ActionsPlacement = EnumLiteralsOf<typeof ACTIONS_PLACEMENT>;

/** Ось S — выбор папки на странице тайтла. */
export const PICKER_VARIANT = {
  /** S1 — Select, «Убрать» красный за разделителем. */
  SELECT_RED: 'selectRed',
  /** S2 — Select, «Убрать» серый за разделителем. */
  SELECT_GRAY: 'selectGray',
  /** S3 — кнопка с меню, как в читалке. */
  MENU: 'menu',
  /** S4 — выбранный пункт красится в цвет папки, а не в акцент. */
  SELECT_FOLDER_TINT: 'selectFolderTint',
  /** S5 — у выбранного нет подложки: только галочка и залитая иконка. */
  SELECT_PLAIN: 'selectPlain',
  /** S6 — список без цвета: иконки серые, у выбранного — акцентные. */
  SELECT_MONO: 'selectMono',
  /** S7 — поле окрашено в цвет папки, список — как в S4. */
  SELECT_FOLDER_FIELD: 'selectFolderField',
} as const;
export type PickerVariant = EnumLiteralsOf<typeof PICKER_VARIANT>;

/** Ось R — кнопка закладки в читалке. */
export const READER_VARIANT = {
  /** R0 — как сейчас: контурная, без действия. */
  CURRENT: 'current',
  /** R1 — нейтральная, залита, когда в закладках. */
  NEUTRAL: 'neutral',
  /** R2 — залита цветом папки. */
  FOLDER_COLOR: 'folderColor',
  /** R3 — залита акцентом. */
  ACCENT: 'accent',
  /** R2a — контурная закладка в цвете папки. */
  FOLDER_OUTLINE: 'folderOutline',
  /** R2c — контурная иконка самой папки в её цвете. */
  FOLDER_GLYPH: 'folderGlyph',
} as const;
export type ReaderVariant = EnumLiteralsOf<typeof READER_VARIANT>;

/** Ось K — метка «в закладках» на карточке каталога. */
export const MARKER_VARIANT = {
  /** K1 — общая залитая закладка. */
  BOOKMARK: 'bookmark',
  /** K2 — иконка папки в её цвете. */
  FOLDER_ICON: 'folderIcon',
  /** K3 — иконка и название папки пилюлей. */
  FOLDER_PILL: 'folderPill',
} as const;
export type MarkerVariant = EnumLiteralsOf<typeof MARKER_VARIANT>;

/** Ось N — пометка новой главы в списке глав. */
export const NEW_CHAPTER_VARIANT = {
  /** N1 — бейдж справа, перед датой. */
  BADGE_RIGHT: 'badgeRight',
  /** N2 — бейдж сразу за номером. */
  BADGE_NUMBER: 'badgeNumber',
  /** N3 — точка у узла на линии. */
  NODE_DOT: 'nodeDot',
} as const;
export type NewChapterVariant = EnumLiteralsOf<typeof NEW_CHAPTER_VARIANT>;

/** Ось D — точка на иконке шапки и пункте футера. */
export const DOT_VARIANT = {
  /** D1 — точка Indicator. */
  DOT: 'dot',
  /** D2 — точка с вырезом под фон. */
  CUTOUT: 'cutout',
  /** D3 — число тайтлов с новыми главами. */
  COUNT: 'count',
} as const;
export type DotVariant = EnumLiteralsOf<typeof DOT_VARIANT>;

/** Ось G — блок папок в профиле. */
export const PROFILE_VARIANT = {
  /** G1 — ProgressList. */
  PROGRESS_LIST: 'progressList',
  /** G2 — строки со стрелкой. */
  ROWS: 'rows',
  /** G3 — составная полоса и легенда. */
  STACKED_BAR: 'stackedBar',
} as const;
export type ProfileVariant = EnumLiteralsOf<typeof PROFILE_VARIANT>;

/** Ось M — модалка выбора папки при склейке. */
export const MERGE_VARIANT = {
  /** M1 — Radio.Card двух папок. */
  RADIO_CARDS: 'radioCards',
  /** M1a — то же, иконка красится вместе с карточкой. */
  RADIO_CARDS_INHERIT: 'radioCardsInherit',
  /** M1b — без подложки: у выбранной только рамка и индикатор. */
  RADIO_CARDS_BORDER: 'radioCardsBorder',
  /** M1c — иконка папки в своей плашке её цвета. */
  RADIO_CARDS_PLATE: 'radioCardsPlate',
  /** M1d — выбранная карточка в цвете папки, как выбранный пункт S4. */
  RADIO_CARDS_FOLDER_TINT: 'radioCardsFolderTint',
  /** M2 — Select. */
  SELECT: 'select',
  /** M3 — две кнопки-папки вместо подтверждения. */
  BUTTONS: 'buttons',
} as const;
export type MergeVariant = EnumLiteralsOf<typeof MERGE_VARIANT>;

export type MockFolder = {
  id: string;
  /** null — своя папка. */
  builtIn: BuiltInFolder | null;
  /** У встроенных — null, название берётся из `getBuiltInFolderLabel`. */
  name: string | null;
  icon: FolderIcon | null;
  color: FolderColor | null;
  trackUpdates: boolean;
  count: number;
  /** Сколько тайтлов папки с новыми главами. */
  newCount: number;
};

/** Папка, у которой уже вычислены название, иконка и цвет — с учётом стиля встроенных. */
export type ResolvedFolder = {
  id: string;
  isBuiltIn: boolean;
  name: string;
  icon: FolderIcon;
  color: MantineColor;
  trackUpdates: boolean;
  count: number;
  newCount: number;
};

export type MockBookmark = {
  id: string;
  name: string;
  coverSeed: string;
  isAdult?: boolean;
  /** Источник, на который ведёт карточка (свежая отметка), — первым. */
  sourceIds: SourceId[];
  folderId: string;
  /** Где остановился; null — отметки нет. */
  progress: { chapter: number; total: number } | null;
  /** Всего глав — когда отметки нет. */
  chaptersCount: number | null;
  newChaptersCount: number;
  /** Когда вышла последняя новая глава — «вчера», «3 дня назад»; для C12. */
  updatedAgo?: string;
  availability: Availability;
  typeLabel: string;
};

export type MockCatalogTitle = {
  id: string;
  name: string;
  coverSeed: string;
  typeLabel: string;
  year: number;
  chaptersCount: number;
  rating: number | null;
  isAdult?: boolean;
  /** В какой папке; null — не в закладках. */
  folderId: string | null;
};

export type MockChapter = {
  number: number;
  title: string | null;
  date: string;
  isRead: boolean;
  isNew: boolean;
  /** Своя отметка на этой главе. */
  isMarked?: boolean;
};

/** Сколько своих папок можно завести. */
export const CUSTOM_FOLDERS_LIMIT = 20;
/** Длина названия папки после trim. */
export const FOLDER_NAME_MAX_LENGTH = 32;
/** Порог, после которого счётчик новых глав пишется «99+». */
export const NEW_CHAPTERS_CAP = 99;

/** Что сделать с тайтлами удаляемой папки. */
export const DELETE_FOLDER_ACTION = {
  MOVE: 'move',
  REMOVE: 'remove',
} as const;
export type DeleteFolderAction = EnumLiteralsOf<typeof DELETE_FOLDER_ACTION>;

/** Ось P — выбор иконки и цвета в модалке папки. */
export const ICON_PICKER_VARIANT = {
  /** P1 — две отдельные сетки: иконки серые, цвета кружками. */
  SEPARATE: 'separate',
  /** P2 — цвета сверху, иконки уже в выбранном цвете. */
  TINTED: 'tinted',
} as const;
export type IconPickerVariant = EnumLiteralsOf<typeof ICON_PICKER_VARIANT>;

/** Папка тайтла в макете — общая для «В закладки», читалки и метки в каталоге в «Итоге». */
export type FolderChoice = {
  folderId: string | null;
  select: (id: string) => void;
  remove: () => void;
};
