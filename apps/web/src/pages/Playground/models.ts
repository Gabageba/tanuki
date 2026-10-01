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
    path: ROUTE_PATHS.PLAYGROUND_LOGIN_BADGE,
    title: 'Пометка о входе',
    description:
      'На телефоне бейдж обязательности входа за названием источника съедает само название — чем его заменить в настройках и в профиле.',
    createdAt: '2026-10-01',
    decision: 'L2b + I2',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_ADULT_CONTENT,
    title: 'Контент 18+',
    description:
      'Две настройки 18+ живут независимо и пересказывают друг друга — как связать их в одну с вложенной, назвать и показать, как выглядят размытые обложки и закрытая страница.',
    createdAt: '2026-10-01',
    decision: 'R3 + P3 + F1b + B1 + M1 + S0',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_THEME_PICKER,
    title: 'Выбор темы',
    description:
      'Карточки с превью из макета слишком крупные и на десктопе, и на телефоне — какой размер и раскладку взять, сохранив превью.',
    createdAt: '2026-09-30',
    decision: 'T3',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_IMPORT_SOURCE_PICKER,
    title: 'Выбор источника для импорта',
    description:
      'На первом шаге импорта выбираем конкретный источник, а не сеть — как показать список, чтобы было видно и источник, и чей аккаунт.',
    createdAt: '2026-09-30',
    decision: 'C1c',
  },
  {
    path: ROUTE_PATHS.PLAYGROUND_SOURCES_SETUP,
    title: 'Настройка источников',
    description:
      'Порядок и включение остаются в настройках, аккаунты уходят в профиль — как пометить, где нужен вход, обязателен ли он и что даёт.',
    createdAt: '2026-09-30',
    decision: 'S1 + P1 + T1–T3 + I1',
  },
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
