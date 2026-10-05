import type { ReactNode } from 'react';

/** Ключ составного столбца: подпись после названия у активного столбца («Даты · регистрация»),
 *  пункт меню («По регистрации») и его иконка. */
export type SortKeyOption<Sort extends string> = {
  sort: Sort;
  label: string;
  menuLabel: string;
  icon: ReactNode;
};
