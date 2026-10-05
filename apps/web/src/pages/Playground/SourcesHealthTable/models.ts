import type { ReactNode } from 'react';
import type { EnumLiteralsOf, Source, SortDirection } from '@tanuki/contracts';

/** Итог одной ночной проверки — для полоски T4. Ночная проверка либо прошла, либо упала;
 *  «нестабилен» выставляет только живой трафик, поэтому третьего цвета у ночи нет. */
export const NIGHT_RESULT = {
  PASSED: 'passed',
  FAILED: 'failed',
  NONE: 'none',
} as const;
export type NightResult = EnumLiteralsOf<typeof NIGHT_RESULT>;

export type Night = {
  date: string;
  result: NightResult;
};

export type MockSource = Pick<
  Source,
  | 'id'
  | 'title'
  | 'domain'
  | 'contentType'
  | 'status'
  | 'statusReason'
  | 'statusChangedAt'
  | 'checkedAt'
  | 'failedProbeStreak'
  | 'lastError'
> & {
  /** Последние 30 ночей, старые слева. В API такой истории сейчас нет — только для T4. */
  nights: Night[];
};

export const TABLE_LAYOUT = {
  CURRENT: 'current',
  ERROR_COLUMN: 'errorColumn',
  ERROR_UNDER_STATUS: 'errorUnderStatus',
  ERROR_IN_DRAWER: 'errorInDrawer',
  NIGHTS_STRIP: 'nightsStrip',
  REASON_COLUMN: 'reasonColumn',
} as const;
export type TableLayout = EnumLiteralsOf<typeof TABLE_LAYOUT>;

export const DRAWER_LAYOUT = {
  FIELDS: 'fields',
  ERROR_FIRST: 'errorFirst',
  REASON_WITH_ERROR: 'reasonWithError',
  REASON_WITH_ERROR_FIRST: 'reasonWithErrorFirst',
  FIELDS_TITLED: 'fieldsTitled',
} as const;
export type DrawerLayout = EnumLiteralsOf<typeof DRAWER_LAYOUT>;

export const VIEWER = {
  STAFF: 'staff',
  USER: 'user',
} as const;
export type Viewer = EnumLiteralsOf<typeof VIEWER>;

export const DEMO_STATE = {
  DATA: 'data',
  LOADING: 'loading',
  EMPTY: 'empty',
} as const;
export type DemoState = EnumLiteralsOf<typeof DEMO_STATE>;

export const HEALTH_SORT = {
  TITLE: 'title',
  STATUS: 'status',
  STATUS_CHANGED_AT: 'statusChangedAt',
  CHECKED_AT: 'checkedAt',
  FAILED_PROBE_STREAK: 'failedProbeStreak',
} as const;
export type HealthSort = EnumLiteralsOf<typeof HEALTH_SORT>;

export type SortState = {
  sort: HealthSort;
  direction: SortDirection;
};

export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  layout: TableLayout;
};

export type DrawerVariant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  layout: DrawerLayout;
};

/** Ширины столбцов в процентах — таблицы `layout="fixed"`, как в «Управлении», чтобы столбцы не
 *  скакали при сортировке и фильтрах. */
export const COLUMN_WIDTH = {
  WIDE: {
    SOURCE: '26%',
    STATUS: '30%',
    PROBE: '18%',
    EXTRA: '26%',
  },
  NARROW: {
    SOURCE: '32%',
    STATUS: '42%',
    PROBE: '26%',
  },
} as const;

/** Копия `SortKeyOption` из `pages/Management/models.ts` — страницы не импортируют друг друга. */
export type SortKeyOption<Sort extends string> = {
  sort: Sort;
  label: string;
  menuLabel: string;
  icon: ReactNode;
};
