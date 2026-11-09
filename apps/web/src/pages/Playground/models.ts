import type { ComponentType } from 'react';
import AccountGroups from './AccountGroups';
import AccountMenu from './AccountMenu';
import Bookmarks from './Bookmarks';
import BookmarkUpdates from './BookmarkUpdates';
import AdultContent from './AdultContent';
import BranchControls from './BranchControls';
import ChartLabels from './ChartLabels';
import CoverlessTitleCard from './CoverlessTitleCard';
import FolderRow from './FolderRow';
import HeaderBackground from './HeaderBackground';
import Home from './Home';
import ImportSourcePicker from './ImportSourcePicker';
import InvitesTable from './InvitesTable';
import LibraryBackup from './LibraryBackup';
import LoginBadge from './LoginBadge';
import MultiselectOptions from './MultiselectOptions';
import Notifications from './Notifications';
import OfflineDownloads from './OfflineDownloads';
import ReadingMarks from './ReadingMarks';
import ReadingSettings from './ReadingSettings';
import ReaderImprovements from './ReaderImprovements';
import SelectionsTabs from './SelectionsTabs';
import SortKeys from './SortKeys';
import SourceImport from './SourceImport';
import SourcesHealthTable from './SourcesHealthTable';
import SourcesSetup from './SourcesSetup';
import ThemePicker from './ThemePicker';
import TitleSearch from './TitleSearch';
import TitleBookmarkMarkers from './TitleBookmarkMarkers';
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
    slug: 'coverless-title-card',
    Component: CoverlessTitleCard,
    title: 'Карточка тайтла без обложки',
    description:
      '«Популярные» Nude-Moon: плотность карточки, метка папки, 18+, теги и лайки; месяц и сортировка, колонки и состояния без места под обложку.',
    createdAt: '2026-11-06',
    decision: 'C2 + T1a + M9 + P2 + L2',
  },
  {
    slug: 'bookmark-updates',
    Component: BookmarkUpdates,
    title: 'Новые главы в закладках',
    description:
      'Выбран N18: оранжевая мета при новых главах. Прежняя точка, боковые линии и остальные макеты сохранены для сравнения.',
    createdAt: '2026-11-05',
    decision: 'N18',
  },
  {
    slug: 'title-bookmark-markers',
    Component: TitleBookmarkMarkers,
    title: 'Маркеры папки в списке',
    description:
      'Где показать папку тайтла в обычной и компактной карточке: справа от названия, перед ним, флажком на обложке или плашкой в нижней строке.',
    createdAt: '2026-11-04',
    decision: 'K4a — прежняя метка на обложке',
  },
  {
    slug: 'reader-improvements',
    Component: ReaderImprovements,
    title: 'Возможности читалки',
    description:
      'Настройки направления, разворота, фона и поведения; панель читалки и выравнивание страниц разворота.',
    createdAt: '2026-11-01',
    decision: 'R2 + S1 + P1 + D1',
  },
  {
    slug: 'source-import',
    Component: SourceImport,
    title: 'Импорт из источника',
    description:
      'Как выглядят шаги модалки импорта закладок с сайта по плану docs/plans/source-import.md: выбор целыми папками сайта (и отброшенный список тайтлов), «Вопросы» и «Готово», плюс кнопки импорта в «Аккаунтах источников» и пустых закладках.',
    createdAt: '2026-10-23',
    decision: 'F1 + S + Q + G3 + H0 + E4',
  },
  {
    slug: 'library-backup',
    Component: LibraryBackup,
    title: 'Резервная копия библиотеки',
    description:
      'Как выглядят создание и восстановление резервной копии по плану docs/plans/library-backup.md: строки в «Профиль → Данные», шаги модалки «Файл → Сводка → Готово», вопросы о конфликтах, предупреждение перед заменой и итог с пропущенным.',
    createdAt: '2026-10-23',
    decision: 'R1 + F1 + T2 + H1 + S1 + Q1a + D1 + ★3',
  },
  {
    slug: 'folder-row',
    Component: FolderRow,
    title: 'Строка папки в настройках',
    description:
      'Как устроить строку папки в настройках закладок, чтобы у встроенных не оставалось пустого места под меню справа от тумблера, а тумблеры не вставали вразнобой.',
    createdAt: '2026-10-15',
    decision: 'V0a',
  },
  {
    slug: 'offline-downloads',
    Component: OfflineDownloads,
    title: 'Скачивание глав и офлайн',
    description:
      'Как выглядят скачивание и работа без сети по плану docs/plans/offline-downloads.md: иконка состояния в строке главы, плашка на тайтле, модалка «Скачать главы», страница «Загрузки», строка в профиле и вкладка настроек, индикация «Нет сети», каталог и поиск без сети, обновление и установка приложения.',
    createdAt: '2026-10-14',
    decision:
      'C2e + D2 + B3 + M2 + Q2 + L4 + E2 + P2 + S2a + N2b + U1 + K·пусто + T1 + T2 + I1 + H1 + H11',
  },
  {
    slug: 'selections-tabs',
    Component: SelectionsTabs,
    title: 'Подборки вкладками',
    description:
      'Как переложить страницу подборок на вкладки: что выбирается селектором (источник или блок) и каким, где он стоит, вид вкладок блоков, сетка блока с подгрузкой порций там, где сайт её даёт, и как выглядит конец блока без продолжения и ошибка подгрузки.',
    createdAt: '2026-10-13',
    decision: 'R1 + S2 + M1 + T1 + E4 + F1 + Z1a + H3 (кнопка «Каталог») + P2',
  },
  {
    slug: 'home-page',
    Component: Home,
    title: 'Главная',
    description:
      'Как устроены главная и подборки источников по плану docs/plans/home-page.md: «Продолжить чтение» и как убрать из него, подборки — на главной или отдельной страницей, входы с главной и её наполнение, кнопка «Главная» в шапке и нижней панели, вкладка настроек, пустые состояния.',
    createdAt: '2026-10-12',
    decision:
      'P4a + V2a + W2 (без «Из подборок» и «Давно не открывали») + C1a + U1 + P3a + K1 + L4 + Z1 + H3a + B1 + T1a + E2',
  },
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
