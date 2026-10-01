import type { MantineColor } from '@mantine/core';
import type { EnumLiteralsOf, SourceId } from '@tanuki/contracts';

/** Ширина рамки «телефон». */
export const MOBILE_FRAME_WIDTH = 375;

// StatusScreen тянется на высоту окна за вычетом шапки — в макете «шапка» подменена так, чтобы
// экран занял ~480px, а не весь экран.
export const FRAME_HEIGHT_STYLE = {
  '--app-shell-header-offset': 'calc(100dvh - 480px)',
  '--app-shell-footer-offset': '0rem',
};

/** Колонка «Общих» настроек на десктопе: GroupedList там стоят в сетке из двух. */
export const SETTINGS_COLUMN_WIDTH = 620;

/**
 * Те же два поля, что в UserSettings. В новой логике showAdultSources — главный тумблер
 * «Показывать 18+», hideAdultTitles — вложенное «Размывать обложки», действующее только при
 * выключенном главном.
 */
export type AdultSettings = {
  showAdultSources: boolean;
  hideAdultTitles: boolean;
};

/** Как вложенная строка ведёт себя при включённом «Показывать 18+». */
export const NESTED_LAYOUT = {
  COLLAPSE: 'collapse',
  DISABLED: 'disabled',
} as const;
export type NestedLayout = EnumLiteralsOf<typeof NESTED_LAYOUT>;

/** Набор текстов блока. */
export const COPY_VARIANT = {
  PLAIN: 'plain',
  STATEFUL: 'stateful',
  GROUP_CAPTION: 'groupCaption',
} as const;
export type CopyVariant = EnumLiteralsOf<typeof COPY_VARIANT>;

/** Есть ли в строке «Размывать обложки» мини-обложка. */
export const COVER_PREVIEW = {
  INLINE: 'inline',
  NONE: 'none',
} as const;
export type CoverPreview = EnumLiteralsOf<typeof COVER_PREVIEW>;

/** Что лежит поверх размытой обложки. */
export const BLUR_STYLE = {
  PLAIN: 'plain',
  ICON: 'icon',
  BADGE: 'badge',
  DIMMED: 'dimmed',
} as const;
export type BlurStyle = EnumLiteralsOf<typeof BLUR_STYLE>;

/** Экран на месте страницы скрытого тайтла. */
export const LOCK_SCREEN = {
  CURRENT: 'current',
  WITH_COVER: 'withCover',
} as const;
export type LockScreen = EnumLiteralsOf<typeof LOCK_SCREEN>;

export type MockTitle = {
  id: string;
  name: string;
  sourceId: SourceId;
  isAdult: boolean;
  type: string;
  year: number;
  chaptersCount: number;
  /** Два цвета градиента сгенерированной обложки — настоящих картинок в макете нет. */
  colors: [MantineColor, MantineColor];
};

export type SettingsTexts = {
  groupLabel: string;
  groupCaption?: string;
  mainTitle: string;
  mainDescription?: string;
  blurTitle: string;
  blurDescription?: string;
};

/** Что демо отдаёт блоку настроек. */
export type SettingsRenderProps = {
  settings: AdultSettings;
  onChange: (patch: Partial<AdultSettings>) => void;
  /** Включение «Показывать 18+» идёт через подтверждение возраста. */
  onShowAdultRequest: () => void;
};

/** R3/R4: что показывает заблокированный тумблер «Размывать обложки», пока 18+ включён. */
export const SWITCH_WHEN_LOCKED = {
  OFF: 'off',
  KEEP: 'keep',
} as const;
export type SwitchWhenLocked = EnumLiteralsOf<typeof SWITCH_WHEN_LOCKED>;

/** Пары заголовков и описаний H1–H4. */
export const HEADING_VARIANT = {
  SHOW: 'show',
  ADULT_CONTENT: 'adultContent',
  ALLOW: 'allow',
  SHOW_CONTENT: 'showContent',
} as const;
export type HeadingVariant = EnumLiteralsOf<typeof HEADING_VARIANT>;

/** Строка-превью последней строкой группы. */
export const GROUP_PREVIEW = {
  NONE: 'none',
  ROW: 'row',
  ROW_WITH_DATE: 'rowWithDate',
} as const;
export type GroupPreview = EnumLiteralsOf<typeof GROUP_PREVIEW>;

export type HeadingTexts = {
  mainTitle: string;
  mainDescription: string;
  blurTitle: string;
  blurDescription: string;
};

export type FlatConfig = {
  switchWhenLocked: SwitchWhenLocked;
  heading: HeadingVariant;
  preview: GroupPreview;
};

/** N1–N3: как назвать тайтлы 18+ на обычных источниках. */
export const TERM = {
  REGULAR_SOURCES: 'regularSources',
  SEPARATE: 'separate',
  COMMON_CATALOG: 'commonCatalog',
} as const;
export type Term = EnumLiteralsOf<typeof TERM>;

/** Термин в двух формах: заголовком строки и внутри фразы. */
export type TermForms = {
  title: string;
  inline: string;
};

/** F1–F4: подача одной и той же логики. */
export const FRAMING = {
  OBJECTS: 'objects',
  EXCEPTION: 'exception',
  LEVELS: 'levels',
  TWO_SWITCHES: 'twoSwitches',
} as const;
export type Framing = EnumLiteralsOf<typeof FRAMING>;

/** a — описания статичные, b — меняются с состоянием. */
export const DESCRIPTION_MODE = {
  STATIC: 'static',
  DYNAMIC: 'dynamic',
} as const;
export type DescriptionMode = EnumLiteralsOf<typeof DESCRIPTION_MODE>;

/** Три реальных состояния двух полей — уровни F3. */
export const ADULT_LEVEL = {
  HIDDEN: 'hidden',
  PARTIAL: 'partial',
  ALL: 'all',
} as const;
export type AdultLevel = EnumLiteralsOf<typeof ADULT_LEVEL>;

export type FramingRenderProps = {
  settings: AdultSettings;
  term: TermForms;
  mode: DescriptionMode;
  /** Скрыть что-то можно сразу. */
  onChange: (patch: Partial<AdultSettings>) => void;
  /** Открыть контент 18+ — только через подтверждение возраста; reveals — что станет видно. */
  onReveal: (patch: Partial<AdultSettings>, reveals: string) => void;
};

/** Текст и кнопка заглушки тайтла в данной подаче. */
export type LockTexts = {
  description: string;
  buttonLabel: string;
  patch: Partial<AdultSettings>;
  reveals: string;
};
