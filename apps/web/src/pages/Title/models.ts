import type { ReactNode } from 'react';
import type useTitleDetails from '@/entities/title/hooks/useTitleDetails';

export type TitleDetailsQuery = ReturnType<typeof useTitleDetails>;

/** Параметры страницы. Выбранная ветка живёт здесь, а не во вкладке глав: скелетон страницы при
 *  перезапросе тайтла размонтирует содержимое, а выбор остаётся. */
export type TitlePageParams = {
  titleId: string;
  /** null — первая ветка. */
  branchId: string | null;
};

export type TitleInfoItem = {
  label: string;
  value: ReactNode | undefined;
  /** Значение читается как показание, а не как речь: счётчик, оценка, год. */
  isNumeric?: boolean;
};
