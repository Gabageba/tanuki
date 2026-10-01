import type { ReactNode } from 'react';
import type { EnumLiteralsOf, ReaderSettings } from '@tanuki/contracts';

/** Ширина рамки «телефон». */
export const MOBILE_FRAME_WIDTH = 375;

/** Колонка настроек на десктопе: GroupedList на «Общих» стоят в сетке из двух. */
export const SETTINGS_COLUMN_WIDTH = 620;

/** Вся вкладка на десктопе — для осей названия и раскладки. */
export const TAB_WIDTH = 1080;

/** Отступ строки, вложенной под заголовок строки настроек: иконка 24px плюс gap md. */
export const ROW_CONTENT_OFFSET = 40;

/** Значение ширины контейнера не из пресетов — так в читалке его оставил ползунок. Нужно, чтобы
 *  было видно, как вариант показывает «своё» значение. */
export const CUSTOM_CONTAINER_WIDTH = 840;

/** Как названа новая вкладка (ось N). */
export const TAB_NAMING = {
  READING: 'reading',
  LIBRARY_AND_READING: 'libraryAndReading',
  READER: 'reader',
  TWO_TABS: 'twoTabs',
} as const;
export type TabNaming = EnumLiteralsOf<typeof TAB_NAMING>;

/** Как разложены блоки вкладки (ось L). */
export const TAB_LAYOUT = {
  ONE_BLOCK: 'oneBlock',
  SPLIT_BLOCKS: 'splitBlocks',
  ONE_COLUMN: 'oneColumn',
} as const;
export type TabLayout = EnumLiteralsOf<typeof TAB_LAYOUT>;

/** Чем выбирается режим чтения и масштаб (ось C). */
export const CHOICE_CONTROL = {
  CARDS: 'cards',
  SEGMENTED: 'segmented',
  SELECT: 'select',
  RADIO_ROWS: 'radioRows',
} as const;
export type ChoiceControl = EnumLiteralsOf<typeof CHOICE_CONTROL>;

/** Чем задаются числовые настройки (ось S). */
export const NUMBER_CONTROL = {
  DRAWER: 'drawer',
  /** Как DRAWER, но с описанием в строке и в обычном состоянии — для итога. */
  DRAWER_DESCRIBED: 'drawerDescribed',
  SLIDER: 'slider',
  PRESETS: 'presets',
  INPUT: 'input',
} as const;
export type NumberControl = EnumLiteralsOf<typeof NUMBER_CONTROL>;

/** Как объяснено, почему зависимая настройка сейчас не действует (ось D). */
export const DISABLED_HINT = {
  DESCRIPTION: 'description',
  SUBGROUPS: 'subgroups',
  TOOLTIP: 'tooltip',
} as const;
export type DisabledHint = EnumLiteralsOf<typeof DISABLED_HINT>;

/** Блоки настроек читалки. VERTICAL и HORIZONTAL появляются только при подгруппах по режиму (D2),
 *  SPACING — без них; READER — всё одним блоком (L1). */
export const READER_GROUP = {
  READER: 'reader',
  DISPLAY: 'display',
  SPACING: 'spacing',
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
  BEHAVIOR: 'behavior',
} as const;
export type ReaderGroup = EnumLiteralsOf<typeof READER_GROUP>;

export type ReaderConfig = {
  choice: ChoiceControl;
  number: NumberControl;
  hint: DisabledHint;
};

export type ChoiceOption = {
  value: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export type NumberPreset = {
  label: string;
  value: number;
};

export type DemoRenderProps = {
  settings: ReaderSettings;
  onChange: (patch: Partial<ReaderSettings>) => void;
  /** Вариант стоит в рамке телефона: брейкпоинты смотрят на окно, а не на рамку. */
  narrow: boolean;
};

export type Variant<Value> = {
  code: string;
  title: string;
  description: string;
  value: Value;
};
