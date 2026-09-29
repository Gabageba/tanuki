import { ROUTE_PATHS, type RoutePath } from '@/shared/lib/routes';

export type PlaygroundTask = {
  path: RoutePath;
  title: string;
  description: string;
  createdAt: string;
  /** Какой вариант выбран; пока не выбран — undefined. */
  decision?: string;
};

/** Задачи, для которых в песочнице собраны макеты вариантов. Новые — сверху. Страницы остаются и
 *  после выбора — как артефакт решения, — но живут только в DEV и в сборку не попадают, поэтому
 *  тексты не идут через i18n. */
export const PLAYGROUND_TASKS: PlaygroundTask[] = [
  {
    path: ROUTE_PATHS.PLAYGROUND_HEADER_BACKGROUND,
    title: 'Фон шапки группы',
    description:
      'Серая подложка шапки GroupedList теряется на светлом фоне страницы — чем её выделить вместо этого.',
    createdAt: '2026-09-30',
    decision: 'B1',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_ACCOUNT_GROUPS,
    title: 'Шапка группы с аккаунтом',
    description:
      'Как оформить строку аккаунта над источниками Grouple, чтобы она читалась как шапка и было видно, вошли ли.',
    createdAt: '2026-09-29',
    decision: 'H3b',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_CHART_LABELS,
    title: 'Подписи месячного графика',
    description:
      'Как подписать 30 столбиков «Прочитано глав» за месяц, чтобы было видно и дату, и к какому столбику она относится.',
    createdAt: '2026-09-28',
    decision: 'L6',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_READING_MARKS,
    title: 'Отметки других источников',
    description:
      'Как показывать на таймлайне глав, где остановились на других источниках, и сводку под «Продолжить».',
    createdAt: '2026-09-24',
    decision: 'A2e + S5 + «Приглушённо»',
  },
];
