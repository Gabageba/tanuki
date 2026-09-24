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
    path: ROUTE_PATHS.PLAYGROUND_READING_MARKS,
    title: 'Отметки других источников',
    description:
      'Как показывать на таймлайне глав, где остановились на других источниках, и сводку под «Продолжить».',
    createdAt: '2026-09-24',
    decision: 'A2e + S5 + «Приглушённо»',
  },
];
