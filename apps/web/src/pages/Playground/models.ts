import type { ComponentType } from 'react';
import AccountGroups from './AccountGroups';
import AccountMenu from './AccountMenu';
import Bookmarks from './Bookmarks';
import AdultContent from './AdultContent';
import BranchControls from './BranchControls';
import ChartLabels from './ChartLabels';
import HeaderBackground from './HeaderBackground';
import ImportSourcePicker from './ImportSourcePicker';
import InvitesTable from './InvitesTable';
import LoginBadge from './LoginBadge';
import MultiselectOptions from './MultiselectOptions';
import Notifications from './Notifications';
import ReadingMarks from './ReadingMarks';
import ReadingSettings from './ReadingSettings';
import SortKeys from './SortKeys';
import SourcesHealthTable from './SourcesHealthTable';
import SourcesSetup from './SourcesSetup';
import ThemePicker from './ThemePicker';
import TitleSearch from './TitleSearch';
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
    slug: 'notifications',
    Component: Notifications,
    title: 'Уведомления',
    description:
      'Как выглядит лента и всё вокруг неё по плану docs/plans/notifications.md: строка ленты, бейдж на колокольчике, фильтр категорий, страницы, пустая лента, тосты, предложение включить push и вкладка настроек.',
    createdAt: '2026-10-09',
    decision:
      'R2 + L1 + N1 + B2 + F1 + P∞ + E3 без ссылки + T1 + D1 + Q1 (≤3) + K4/M3 + X3 + GroupedList',
  },
  {
    slug: 'title-search',
    Component: TitleSearch,
    title: 'Поиск тайтлов',
    description:
      'Как выглядит /search по плану docs/plans/title-search.md: шапка с запросом, секции источников и раскладка карточек, строка «Не ответили», недавние запросы в шапке и на пустой странице, фильтры.',
    createdAt: '2026-10-08',
    decision: 'H6c + S1 + L1s + N5 + D2 + E5 + F6 + G3 + M1 + C1 + V1 + R2',
  },
  {
    slug: 'bookmarks',
    Component: Bookmarks,
    title: 'Закладки',
    description:
      'Как выглядят закладки по плану docs/plans/bookmarks.md: карточка с прогрессом и новыми главами, вкладки-папки, «В закладки» на тайтле и в читалке, метки в каталоге и списке глав, точка в шапке, папки в настройках и профиле, модалки.',
    createdAt: '2026-10-07',
    decision: 'C10h + U3a + T2 + A1 + I1 + E + S4 + R2c + K4a + N3 + D1 + F1 + P2 + G1 + M1d + Q4',
  },
  {
    slug: 'account-menu',
    Component: AccountMenu,
    title: 'Меню аккаунта и drawer’ы',
    description:
      'Меню аватара и мобильное меню расходятся по составу и размеру пунктов, на телефоне нет профиля; drawer’ы выезжают с разных сторон и подписаны словом — как подать аккаунт, оформить заголовки drawer’ов и с какой стороны их открывать.',
    createdAt: '2026-10-05',
    decision: 'M5a + H1a + D1',
  },
  {
    slug: 'multiselect-options',
    Component: MultiselectOptions,
    title: 'Пункты мультиселекта',
    description:
      'Выбранные подряд пункты MultiSelect слипаются рамками в стопку, а курсор клавиатуры выглядит как выбор — как оформить выбранный пункт и фокус в общем виде списков.',
    createdAt: '2026-10-05',
    decision: 'O1 + K0',
  },
  {
    slug: 'sources-health-table',
    Component: SourcesHealthTable,
    title: 'Таблица здоровья источников',
    description:
      'Семь столбцов /sources/health не похожи на таблицы «Управления» — что объединить в составные ячейки, куда деть текст ошибки и кнопку проверки, нужны ли фильтры, сортировка и карточка источника.',
    createdAt: '2026-10-05',
    decision: 'T5 + D3',
  },
  {
    slug: 'sort-keys',
    Component: SortKeys,
    title: 'Сортировка составных столбцов',
    description:
      'В таблицах «Управления» в ячейке по два значения, а заголовок сортирует по одному — и не видно, по какому. Как выбрать ключ в заголовке и как показать его в строках.',
    createdAt: '2026-10-05',
    decision: 'K2c + H0',
  },
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
