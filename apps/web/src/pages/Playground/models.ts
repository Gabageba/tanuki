import type { ComponentType } from 'react';
import AccountGroups from './AccountGroups';
import AdultContent from './AdultContent';
import BranchControls from './BranchControls';
import ChartLabels from './ChartLabels';
import HeaderBackground from './HeaderBackground';
import ImportSourcePicker from './ImportSourcePicker';
import InvitesTable from './InvitesTable';
import LoginBadge from './LoginBadge';
import ReadingMarks from './ReadingMarks';
import ReadingSettings from './ReadingSettings';
import SourcesSetup from './SourcesSetup';
import ThemePicker from './ThemePicker';
import UsersAdmin from './UsersAdmin';

export type PlaygroundTask = {
  /** Адрес страницы внутри песочницы: `/playground/<slug>`. */
  slug: string;
  Component: ComponentType;
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
    slug: 'invites-table',
    Component: InvitesTable,
    title: 'Таблица приглашений',
    description:
      'Вкладка «Приглашения» перенесена из /invites как есть и не похожа на соседних «Пользователей» — как переложить её на те же фильтры, сортировку, страницы и карточку, объединять ли ячейки и как переделать модалку создания.',
    createdAt: '2026-10-02',
    decision: 'T3 + N1 + D1 + R1 + L1 + C1 + M9a',
  },
  {
    slug: 'users-admin',
    Component: UsersAdmin,
    title: 'Управление пользователями',
    description:
      'Пагинированная таблица всех пользователей для админа и модераторов — где ей жить, какие столбцы, как подать смену роли, блокировку на срок и удаление с разными правами.',
    createdAt: '2026-10-02',
    decision: 'P3 + T3 + A3 + B2 + D3 + F1 + M1',
  },
  {
    slug: 'branch-controls',
    Component: BranchControls,
    title: 'Ветки и сортировка глав',
    description:
      'Табы веток и кнопка сортировки над списком глав выглядят одинаково и сливаются в кашу — как развести выбор списка и действия над ним.',
    createdAt: '2026-10-01',
    decision: 'B3',
  },
  {
    slug: 'reading-settings',
    Component: ReadingSettings,
    title: 'Вкладка «Чтение» в настройках',
    description:
      'Новая вкладка с категориями закладок и настройками читалки — как её назвать и как переложить настройки из drawer читалки в строки GroupedList.',
    createdAt: '2026-10-01',
    decision: 'N4 + L2 + C2 + S0 + D1',
  },
  {
    slug: 'login-badge',
    Component: LoginBadge,
    title: 'Пометка о входе',
    description:
      'На телефоне бейдж обязательности входа за названием источника съедает само название — чем его заменить в настройках и в профиле.',
    createdAt: '2026-10-01',
    decision: 'L2b + I2',
  },
  {
    slug: 'adult-content',
    Component: AdultContent,
    title: 'Контент 18+',
    description:
      'Две настройки 18+ живут независимо и пересказывают друг друга — как связать их в одну с вложенной, назвать и показать, как выглядят размытые обложки и закрытая страница.',
    createdAt: '2026-10-01',
    decision: 'R3 + P3 + F1b + B1 + M1 + S0',
  },
  {
    slug: 'theme-picker',
    Component: ThemePicker,
    title: 'Выбор темы',
    description:
      'Карточки с превью из макета слишком крупные и на десктопе, и на телефоне — какой размер и раскладку взять, сохранив превью.',
    createdAt: '2026-09-30',
    decision: 'T3',
  },
  {
    slug: 'import-source-picker',
    Component: ImportSourcePicker,
    title: 'Выбор источника для импорта',
    description:
      'На первом шаге импорта выбираем конкретный источник, а не сеть — как показать список, чтобы было видно и источник, и чей аккаунт.',
    createdAt: '2026-09-30',
    decision: 'C1c',
  },
  {
    slug: 'sources-setup',
    Component: SourcesSetup,
    title: 'Настройка источников',
    description:
      'Порядок и включение остаются в настройках, аккаунты уходят в профиль — как пометить, где нужен вход, обязателен ли он и что даёт.',
    createdAt: '2026-09-30',
    decision: 'S1 + P1 + T1–T3 + I1',
  },
  {
    slug: 'header-background',
    Component: HeaderBackground,
    title: 'Фон шапки группы',
    description:
      'Серая подложка шапки GroupedList теряется на светлом фоне страницы — чем её выделить вместо этого.',
    createdAt: '2026-09-30',
    decision: 'B1',
  },
  {
    slug: 'account-groups',
    Component: AccountGroups,
    title: 'Шапка группы с аккаунтом',
    description:
      'Как оформить строку аккаунта над источниками Grouple, чтобы она читалась как шапка и было видно, вошли ли.',
    createdAt: '2026-09-29',
    decision: 'H3b',
  },
  {
    slug: 'chart-labels',
    Component: ChartLabels,
    title: 'Подписи месячного графика',
    description:
      'Как подписать 30 столбиков «Прочитано глав» за месяц, чтобы было видно и дату, и к какому столбику она относится.',
    createdAt: '2026-09-28',
    decision: 'L6',
  },
  {
    slug: 'reading-marks',
    Component: ReadingMarks,
    title: 'Отметки других источников',
    description:
      'Как показывать на таймлайне глав, где остановились на других источниках, и сводку под «Продолжить».',
    createdAt: '2026-09-24',
    decision: 'A2e + S5 + «Приглушённо»',
  },
];
