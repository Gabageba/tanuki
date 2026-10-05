import type { ReactNode } from 'react';
import type { EnumLiteralsOf, SortDirection } from '@tanuki/contracts';

/** Как в заголовке выбирается ключ сортировки — ось K. */
export const SORT_PICKER = {
  /** Один ключ на столбец, как в приложении сейчас. */
  CURRENT: 'current',
  /** Заголовок разбит на части, у каждой своя каретка. */
  SPLIT: 'split',
  /** Заголовок открывает меню ключей. */
  MENU: 'menu',
  /** Меню и подпись выбранного ключа под заголовком. */
  MENU_LABEL: 'menuLabel',
  /** Меню, ключ серым в строку через точку: «Даты · регистрация». */
  MENU_INLINE: 'menuInline',
  /** Меню, ключ вместо названия: «Регистрация». */
  MENU_KEY: 'menuKey',
  /** Меню, ключ бейджем у названия. */
  MENU_CHIP: 'menuChip',
  /** Меню, ключ через двоеточие: «Даты: регистрация». */
  MENU_COLON: 'menuColon',
  /** Итог K2c + H0: ключ в строку через точку, в меню направление — той же двойной кареткой. */
  FINAL: 'final',
} as const;
export type SortPicker = EnumLiteralsOf<typeof SORT_PICKER>;

/** Как в ячейках видно, по чему идёт сортировка — ось H. */
export const SORT_HIGHLIGHT = {
  NONE: 'none',
  /** Сортируемое значение жирнее, парное с ним приглушено. */
  WEIGHT: 'weight',
  /** Сортируемое значение акцентным цветом. */
  ACCENT: 'accent',
  /** Подложка всего активного столбца. */
  COLUMN: 'column',
} as const;
export type SortHighlight = EnumLiteralsOf<typeof SORT_HIGHLIGHT>;

/** Роль значения в ячейке при текущей сортировке. */
export const SORT_MARK = {
  /** Столбец не активен. */
  IDLE: 'idle',
  /** По этому значению сортируется таблица. */
  SORTED: 'sorted',
  /** Соседнее значение в активном столбце — по нему сейчас не сортируется. */
  PAIR: 'pair',
} as const;
export type SortMark = EnumLiteralsOf<typeof SORT_MARK>;

/** Ключи таблицы пользователей: нынешние `MANAGED_USERS_SORT` и три новых — почта, срок, вход. */
export const USER_SORT_KEY = {
  USERNAME: 'username',
  EMAIL: 'email',
  STATUS: 'status',
  STATUS_UNTIL: 'statusUntil',
  INVITED_BY: 'invitedBy',
  CREATED_AT: 'createdAt',
  LAST_SEEN_AT: 'lastSeenAt',
} as const;
export type UserSortKey = EnumLiteralsOf<typeof USER_SORT_KEY>;

/** Ключи таблицы приглашений — те же, что `INVITES_SORT`; у даты создания появляется заголовок. */
export const INVITE_SORT_KEY = {
  ROLE: 'role',
  CREATED_BY: 'createdBy',
  CREATED_AT: 'createdAt',
  STATUS: 'status',
} as const;
export type InviteSortKey = EnumLiteralsOf<typeof INVITE_SORT_KEY>;

export type SortState<Key extends string> = {
  key: Key;
  direction: SortDirection;
};

export type SortKeyOption<Key extends string> = {
  key: Key;
  /** Часть заголовка в K1: «Регистрация». */
  label: string;
  /** Пункт меню в K2: «По регистрации». */
  menuLabel: string;
  /** Подпись под заголовком в K2b: «по регистрации». */
  shortLabel: string;
  /** Ключ в строке с названием в K2c, K2e, K2f: «регистрация». */
  keyLabel: string;
  icon: ReactNode;
  /** С какого направления начинается: даты — новые сверху, сроки — ближайшие, прочее — по порядку. */
  defaultDirection: SortDirection;
};

export type SortColumn<Key extends string> = {
  id: string;
  title: string;
  /** Первый ключ — тот, по которому столбец сортирует сейчас. Пусто — столбец не сортируется. */
  keys: SortKeyOption<Key>[];
};

export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  picker: SortPicker;
  highlight: SortHighlight;
};

/** Ширина, в которой показаны таблицы, — как у прошлых макетов «Управления». */
export const TABLE_WIDTH = 1080;

/** Поправка к стилю значения в ячейке от подсветки оси H. */
export type ValueProps = { c?: string; fw?: number };
