import { useState, type ComponentType } from 'react';
import { Box, Button, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import { INVITE_STATUS, USER_ROLE, type InvitableRole } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import AxisHeader from '../UsersAdmin/components/AxisHeader';
import PhoneFrame from '../UsersAdmin/components/PhoneFrame';
import { DESKTOP_WIDTH } from '../UsersAdmin/models';
import CreateInviteCards from './components/CreateInviteCards';
import CreateInviteCompact from './components/CreateInviteCompact';
import CreateInviteCurrent from './components/CreateInviteCurrent';
import CreateInviteMenu from './components/CreateInviteMenu';
import ModalHeadersGrid from './components/ModalHeadersGrid';
import DemoAgeConfirmModal from './components/DemoAgeConfirmModal';
import DemoBlockUserModal from './components/DemoBlockUserModal';
import DemoClearCacheModal from './components/DemoClearCacheModal';
import DemoDeleteUserModal from './components/DemoDeleteUserModal';
import DemoResetFiltersModal from './components/DemoResetFiltersModal';
import InvitesPanel from './components/InvitesPanel';
import RevokeModal from './components/RevokeModal';
import { getDemoModalLabel } from './lib';
import { BASE_CONFIG, FINAL_CONFIG, MOCK_INVITES, createMockInvite, getSelfName } from './mocks';
import {
  DATA_STATE,
  DEMO_MODAL,
  DRAWER_LAYOUT,
  LINK_RECOVERY,
  MESSAGE_PATTERN,
  NEUTRAL_COLOR,
  NEUTRAL_COLOR_CONTEXT,
  NOW,
  OUTCOME_COLUMN,
  REVOKE_CONFIRM,
  TABLE_LAYOUT,
  VIEWER,
  type DataState,
  type DemoModal,
  type DrawerLayout,
  type InviteActions,
  type LinkRecovery,
  type MessagePattern,
  type MockInvite,
  type NeutralColor,
  type OutcomeColumn,
  type RevokeConfirm,
  type TableLayout,
  type Variant,
  type Viewer,
} from './models';

type CreateProps = {
  viewer: Viewer;
  onCreate: (role: InvitableRole) => MockInvite;
};

const TABLE_VARIANTS: Variant<TableLayout>[] = [
  {
    code: 'T0',
    title: 'Как сейчас',
    description:
      'Прежняя страница /invites, перенесённая вкладкой без изменений: весь список одной таблицей, новые сверху, «Отозвать» прямо в строке.',
    pros: ['Ничего не надо делать'],
    cons: [
      'Не похожа на соседнюю вкладку: роль текстом, нет сортировки, фильтров и страниц, кнопка в строке',
      'У активных пустой «Использовал», у использованных «Истекает» ни о чём не говорит',
      'Активные тонут среди истёкших и отозванных, список растёт бесконечно',
      '«Отозвать» срабатывает сразу, без подтверждения',
    ],
    value: TABLE_LAYOUT.CURRENT,
  },
  {
    code: 'T1',
    title: 'Столбец на каждое поле',
    description:
      'От таблицы пользователей — только обвязка: фильтры, сортировка по любому столбцу, страницы, клик по строке. Ячейки не объединяются: роль и статус бейджами, остальное — по одному значению.',
    pros: ['Каждое поле сортируется своим столбцом', 'Проще всего читать глазами вниз по столбцу'],
    cons: [
      'Шесть столбцов — шире пользователей, на ноутбуке впритык',
      'Пустые ячейки остаются: «Использовал» у всех, кроме использованных',
      'Ритм строки отличается от соседней вкладки — там ячейки в две строки',
    ],
    value: TABLE_LAYOUT.SEPARATE,
  },
  {
    code: 'T2',
    title: 'Составные ячейки, как у пользователей',
    description:
      'Четыре столбца той же высоты, что на соседней вкладке. «Приглашение» — роль и кто создал, своё помечено «Ваше». «Статус» — бейдж и под ним, сколько осталось активному или кто отозвал. «Даты» — создано и вторая строка по статусу: истекает, истекло, использовано или отозвано.',
    pros: [
      'Вкладки выглядят одной таблицей: те же двухстрочные ячейки и аватар у человека',
      'Сколько осталось активному — видно без подсчёта по дате',
      'Вторая дата всегда к месту: у использованного — когда использовали, а не когда истекло бы',
    ],
    cons: [
      'У активных «Использовал» по-прежнему пустой',
      'Сортировать можно по роли и дате создания, но не по создателю',
    ],
    value: TABLE_LAYOUT.MERGED,
  },
  {
    code: 'T3',
    title: '«Итог» вместо пустых ячеек',
    description:
      'Роль, кто и когда создал, статус — и один столбец «Итог», содержимое которого зависит от статуса: у активного — сколько осталось, у использованного — кто зарегистрировался, у истёкшего — что никто не пришёл, у отозванного — кто отозвал.',
    pros: [
      'Ни одной пустой ячейки — каждая строка рассказывает, чем всё кончилось',
      'Отдельно виден создатель и отдельно — тот, кто пришёл',
    ],
    cons: [
      'По «Итогу» не отсортировать: в нём смешаны имена и даты разного смысла',
      'В одном столбце разное содержимое — глазами по нему не пробежаться',
    ],
    value: TABLE_LAYOUT.OUTCOME,
  },
];

const DRAWER_VARIANTS: Variant<DrawerLayout>[] = [
  {
    code: 'D1',
    title: 'Поля, как в карточке пользователя',
    description:
      'Строки «подпись — значение». Показываются только поля этого статуса: у активного — когда истекает, у использованного — кто и когда, у отозванного — кто и когда отозвал. Прочерков нет.',
    pros: ['Та же карточка, что у пользователя', 'Компактно, всё в одном столбце'],
    cons: ['Последовательность событий приходится собирать из дат самому'],
    value: DRAWER_LAYOUT.FIELDS,
  },
  {
    code: 'D2',
    title: 'Лента событий',
    description:
      'Жизнь приглашения сверху вниз: «Создано» — кто и когда, затем чем кончилось. У активного второй шаг ещё не наступил — бледный, к нему ведёт пунктир.',
    pros: ['Сразу видно, на каком этапе приглашение и что будет дальше'],
    cons: [
      'Выше D1 при том же содержании',
      'Карточка приглашения выглядит не так, как карточка пользователя',
    ],
    value: DRAWER_LAYOUT.TIMELINE,
  },
];

const REVOKE_VARIANTS: Variant<RevokeConfirm>[] = [
  {
    code: 'R1',
    title: 'Модалка',
    description:
      '«Отозвать» в карточке открывает окно: что будет со ссылкой и что вернуть её нельзя. Как блокировка и удаление пользователя.',
    pros: ['Промахнуться нельзя', 'Так же, как остальные необратимые действия на странице'],
    cons: ['Ещё одно окно поверх карточки'],
    value: REVOKE_CONFIRM.MODAL,
  },
  {
    code: 'R2',
    title: 'Двухшаговая кнопка',
    description:
      'Первое нажатие превращает кнопку в красную «Точно отозвать?», второе в течение трёх секунд — отзывает. Не нажали — кнопка возвращается.',
    pros: ['Без лишнего окна, подтверждение там же, где действие'],
    cons: [
      'Больше нигде в приложении так не делается',
      'Почему подтверждение пропало через три секунды — неочевидно',
    ],
    value: REVOKE_CONFIRM.TWO_STEP,
  },
];

const LINK_VARIANTS: Variant<LinkRecovery>[] = [
  {
    code: 'L1',
    title: '«Перевыпустить»',
    description:
      'Код по-прежнему хранится только хешем. Потеряли ссылку — «Перевыпустить» в карточке активного приглашения: старое отзывается, создаётся новое с той же ролью, и новая ссылка показывается сразу.',
    pros: [
      'В API — только новая операция, хранение кода не меняется',
      'Утечка базы не раскрывает действующие ссылки',
    ],
    cons: [
      'Это другая ссылка: если старую уже отправили, она перестанет работать',
      'В таблице появляется лишняя отозванная строка',
    ],
    value: LINK_RECOVERY.REISSUE,
  },
  {
    code: 'L2',
    title: 'Ссылка в карточке',
    description:
      'Код хранится обратимо, ссылка активного приглашения видна в карточке с кнопкой копирования — в любой момент, пока приглашение не использовано.',
    pros: ['Ничего не надо пересоздавать', 'Окно после создания можно закрыть без страха'],
    cons: [
      'Миграция: код хранится открыто или зашифрованным ключом сервера',
      'При утечке базы утекут и действующие приглашения (одноразовые, на 7 дней)',
    ],
    value: LINK_RECOVERY.STORED,
  },
];

const CREATE_VARIANTS: Variant<ComponentType<CreateProps>>[] = [
  {
    code: 'C0',
    title: 'Как сейчас',
    description:
      'Переключатель роли и «Создать приглашение», затем в том же окне поле со ссылкой и «Скопировать ссылку».',
    pros: ['Быстро: два клика до ссылки'],
    cons: [
      'Ничего не объясняет: сколько живёт, что одноразовая, что ссылку больше не покажут',
      'После копирования окно не закрыть кнопкой — только крестиком',
      'Форма не на useForm',
    ],
    value: CreateInviteCurrent,
  },
  {
    code: 'C1',
    title: 'Роль карточками с описанием прав',
    description:
      'Пояснение, что такое приглашение, и роли карточками — у каждой сказано, что она даёт. После создания — галочка, кому и до какого числа, ссылка с копированием в поле и «Ещё одно» / «Готово». У модератора выбора нет — одна карточка роли без переключателя.',
    pros: [
      'Понятно, что получит приглашённый',
      'Сказано, что будет, если потерять ссылку',
      'Несколько приглашений подряд — без повторного открытия',
    ],
    cons: ['Самое высокое окно'],
    value: CreateInviteCards,
  },
  {
    code: 'C2',
    title: 'Компактно: список роли',
    description:
      'Одна строка пояснения и роль в Select. После создания — ссылка и крупная «Скопировать ссылку» во всю ширину, под ней — «Готово». У модератора списка нет, роль названа в пояснении.',
    pros: ['Короткое окно', 'Главное действие после создания — самая заметная кнопка'],
    cons: ['О правах роли не сказано', 'Выбор из двух ролей прячется в выпадающий список'],
    value: CreateInviteCompact,
  },
  {
    code: 'C3',
    title: 'Без шага выбора',
    description:
      'Роль выбирается пунктом меню у самой кнопки, окно открывается уже с готовой ссылкой — как в C1. У модератора меню нет: кнопка сразу создаёт приглашение в роль «Пользователь».',
    pros: ['На шаг меньше', 'У модератора — один клик до ссылки'],
    cons: [
      'Приглашение создаётся без подтверждения — его легко выпустить случайно',
      'Пояснение о сроке появляется только после создания',
    ],
    value: CreateInviteMenu,
  },
];

const OUTCOME_VARIANTS: Variant<OutcomeColumn>[] = [
  {
    code: 'N1',
    title: '«Результат»',
    description:
      'Короткое слово, которое подходит и к использованному, и к отозванному приглашению.',
    pros: ['Короткое, не раздвигает столбец', 'Понятно без пояснений у завершённых'],
    cons: ['У активного результата ещё нет — в столбце срок, а не результат'],
    value: OUTCOME_COLUMN.RESULT,
  },
  {
    code: 'N2',
    title: '«Исход»',
    description: 'Точнее всего про то, чем кончилось приглашение.',
    pros: ['Прямо говорит, что в столбце — чем всё кончилось'],
    cons: ['Книжное слово, в интерфейсе приложения таких нет', 'У активного исхода тоже пока нет'],
    value: OUTCOME_COLUMN.ISSUE,
  },
  {
    code: 'N3',
    title: '«Подробности»',
    description: 'Нейтральное название: в столбце — подробности к статусу, какой бы он ни был.',
    pros: ['Честно для всех четырёх статусов, включая активный'],
    cons: ['Ничего не говорит о содержимом — подробности чего?'],
    value: OUTCOME_COLUMN.DETAILS,
  },
  {
    code: 'N4',
    title: 'Без столбца: итог под бейджем статуса',
    description:
      'Отдельного столбца нет — то, что было в нём, стоит под бейджем в «Статусе», как срок у пользователей. Три столбца: Роль · Создал · Статус.',
    pros: [
      'Называть нечего — подпись к статусу стоит у самого статуса',
      'Узнаётся по соседней вкладке: там срок блокировки тоже под бейджем',
      'Сортировка по статусу остаётся',
    ],
    cons: ['Ячейка статуса высокая: под бейджем аватар, имя и дата', 'Строки выше, чем в N1–N3'],
    value: OUTCOME_COLUMN.IN_STATUS,
  },
];

const MESSAGE_VARIANTS: Variant<MessagePattern>[] = [
  {
    code: 'M0',
    title: 'Как сейчас',
    description:
      'Каждая модалка по-своему: «Блокировка», «Удаление» и «Очистка кэша» — весь текст серым 13, «Вам есть 18?» — обычным 13, «Сброс фильтров» — 14. Модалки приглашений — как в R1 и C1 выше.',
    pros: ['Ничего не надо менять'],
    cons: [
      'Главное не отделено от пояснений — всё одним серым абзацем',
      'Размер и цвет текста меняются от модалки к модалке',
      'Опасное действие внешне не отличается от безопасного',
    ],
    value: MESSAGE_PATTERN.CURRENT,
  },
  {
    code: 'M1',
    title: 'Иконка слева, главное 14, пояснения серым 13',
    description:
      'Главная фраза — что произойдёт — обычным 14 рядом с иконкой в кружке, пояснения и последствия — серым 13 под ней, по тому же краю. Цвет иконки — тон: красный для необратимого, акцентный для нейтрального, зелёный для успеха.',
    pros: [
      'Главное читается первым, пояснения — по желанию',
      'Тон виден по цвету ещё до чтения',
      'Не мешает полям и карточкам ниже',
    ],
    cons: ['В каждой модалке нужна иконка по смыслу', 'Текст сдвинут вправо — на телефоне уже'],
    value: MESSAGE_PATTERN.ICON_ASIDE,
  },
  {
    code: 'M2',
    title: 'Без иконок: главное 14, пояснения серым 13',
    description: 'Та же иерархия, что в M1, но без иконки: только размер и цвет текста.',
    pros: ['Проще всего соблюдать', 'Текст во всю ширину модалки'],
    cons: ['Удаление и очистка кэша выглядят одинаково — тон только в цвете кнопки'],
    value: MESSAGE_PATTERN.PLAIN,
  },
  {
    code: 'M3',
    title: 'Крупная иконка по центру',
    description:
      'Иконка тона крупно сверху, главная фраза и пояснения под ней, всё по центру — как в диалогах подтверждения мобильных систем.',
    pros: ['Самый явный тон', 'Хорошо для «Приглашение создано»'],
    cons: [
      'Модалки с полями (блокировка, удаление) — центрированный текст над левыми полями',
      'Самые высокие модалки',
    ],
    value: MESSAGE_PATTERN.CENTERED,
  },
  {
    code: 'M4',
    title: 'Пояснения в плашке тона',
    description:
      'Главная фраза — обычным 14, пояснения и последствия — в Alert цвета тона с иконкой. Без пояснений (сброс фильтров) плашки нет.',
    pros: ['Необратимое бросается в глаза', 'Последствия отделены от главного рамкой'],
    cons: [
      'Тяжело: в коротком подтверждении плашка больше самого вопроса',
      'Зелёная плашка у «Создано» читается как ещё одно уведомление',
    ],
    value: MESSAGE_PATTERN.ALERT,
  },
  {
    code: 'M5',
    title: 'Полоса тона слева от всего текста',
    description:
      'Главная фраза и пояснения — как в M2, но слева от них вертикальная полоса цвета тона. Иконки нет.',
    pros: ['Тон виден, а текст не сдвинут иконкой', 'Одинаково работает и с полями, и без'],
    cons: ['Полоса без иконки не объясняет, что значит цвет', 'Похоже на цитату'],
    value: MESSAGE_PATTERN.STRIPE,
  },
  {
    code: 'M5b',
    title: 'Полоса только у пояснений',
    description:
      'Главная фраза — без украшений, полосой тона отмечены только пояснения и последствия под ней.',
    pros: ['Выделено то, что легко пропустить: последствия', 'Главная фраза во всю ширину'],
    cons: ['В модалке без пояснений («Сброс фильтров») тона нет совсем'],
    value: MESSAGE_PATTERN.DETAILS_STRIPE,
  },
  {
    code: 'M6',
    title: 'Blockquote: полоса и иконка на ней',
    description:
      'Mantine Blockquote: весь текст на лёгкой подложке, слева полоса тона, на её верхнем конце — иконка в кружке.',
    pros: ['И цвет, и смысл тона: полоса плюс иконка', 'Готовый компонент Mantine'],
    cons: ['Тяжелее M5', 'Иконка выступает за левый край текста — нужен отступ'],
    value: MESSAGE_PATTERN.BLOCKQUOTE,
  },
  {
    code: 'M7',
    title: 'Лёгкая подложка с полосой',
    description:
      'Весь текст на едва тонированном фоне с полосой тона слева, без рамки и без иконки — мягкая версия Alert из M4.',
    pros: ['Текст отделён от полей формы', 'Мягче M4: нет рамки и иконки'],
    cons: [
      'В тёмной теме подложка почти не видна — остаётся одна полоса',
      'Пояснения на цветном фоне читаются хуже',
    ],
    value: MESSAGE_PATTERN.TINTED,
  },
  {
    code: 'M8',
    title: 'Маленькая иконка в строку',
    description:
      'Иконка 16px цвета тона, без кружка, прямо перед главной фразой. Пояснения под ней — от левого края, без отступа.',
    pros: ['Самый лёгкий вариант с иконкой', 'Текст почти во всю ширину'],
    cons: ['Иконку легко не заметить', 'Пояснения не выровнены по главной фразе'],
    value: MESSAGE_PATTERN.INLINE_ICON,
  },
  {
    code: 'M9',
    title: 'Тон в заголовке модалки',
    description:
      'Иконка цвета тона стоит у заголовка модалки, в теле — только иерархия текста, как в M2.',
    pros: ['Тело модалки чистое', 'Тон виден первым — вместе с заголовком'],
    cons: [
      'Меняются заголовки всех модалок',
      'Цветная иконка слева перекликается с крестиком справа',
    ],
    value: MESSAGE_PATTERN.TITLE_ICON,
  },
  {
    code: 'M10',
    title: 'Полоса тона по верхнему краю модалки',
    description: 'Модалка целиком окрашена тонкой полосой сверху, текст — как в M2.',
    pros: ['Ни одного лишнего элемента в тексте', 'Тон виден ещё до чтения'],
    cons: [
      'Нейтральная модалка с акцентной полосой выглядит «важной»',
      'Полоса сверху легко принимается за украшение, а не за смысл',
    ],
    value: MESSAGE_PATTERN.TOP_STRIPE,
  },
];

const NEUTRAL_VARIANTS: Variant<NeutralColor>[] = [
  {
    code: 'M9a',
    title: 'Нейтральные — серые',
    description:
      'Иконка нейтральной модалки — цветом пояснений. Цвет остаётся только у тех модалок, где он что-то значит.',
    pros: [
      'Красные, жёлтые и зелёная выделяются — их меньше половины',
      'Новый цвет в палитру не добавляется',
    ],
    cons: ['Нейтральная иконка выглядит приглушённой, особенно в светлой теме'],
    value: NEUTRAL_COLOR.GRAY,
  },
  {
    code: 'M9b',
    title: 'Нейтральные — синие',
    description: 'Привычный «информационный» синий для обычных форм.',
    pros: ['Иконка заметна, но не тревожит'],
    cons: [
      'Синий в приложении уже значит «Модератор» и «Использовано»',
      'Единственный синий элемент оформления в тёплой палитре',
    ],
    value: NEUTRAL_COLOR.BLUE,
  },
  {
    code: 'M9c',
    title: 'Нейтральные — акцентные',
    description: 'Терракотовый акцент приложения, как в M1–M10.',
    pros: ['В цвет бренда', 'Совпадает с цветом главной кнопки нейтральной модалки'],
    cons: [
      'Терракотовый рядом с красным и золотым — нейтральная модалка выглядит настороженной',
      'Половина модалок в цвете — цвет перестаёт выделять опасное',
    ],
    value: NEUTRAL_COLOR.ACCENT,
  },
];

/** Активное приглашение, на котором открывается модалка отзыва на оси M. */
const REVOKE_DEMO_INVITE =
  MOCK_INVITES.find(({ status }) => status === INVITE_STATUS.ACTIVE) ?? null;

type ModalDemo = {
  pattern: MessagePattern;
  /** M9a–M9c; на M0–M10 — акцентный, как было. */
  neutral?: NeutralColor;
  /** null — закрыта; паттерн остаётся, чтобы текст не сменился во время анимации закрытия. */
  modal: DemoModal | null;
};

const isViewer = (value: string): value is Viewer =>
  Object.values(VIEWER).some((viewer) => viewer === value);

const isDataState = (value: string): value is DataState =>
  Object.values(DATA_STATE).some((state) => state === value);

function PlaygroundInvitesTable() {
  const [invites, setInvites] = useState<MockInvite[]>(MOCK_INVITES);
  const [viewer, setViewer] = useState<Viewer>(VIEWER.ADMIN);
  const [dataState, setDataState] = useState<DataState>(DATA_STATE.READY);
  const [modalDemo, setModalDemo] = useState<ModalDemo | null>(null);

  const selfName = getSelfName(viewer);

  const create = (role: InvitableRole) => {
    const invite = createMockInvite(role, selfName, NOW);
    setInvites((current) => [invite, ...current]);
    return invite;
  };

  const revoke = (id: string) =>
    setInvites((current) =>
      current.map((invite) =>
        invite.id === id
          ? { ...invite, status: INVITE_STATUS.REVOKED, revokedBy: selfName, revokedAt: NOW }
          : invite,
      ),
    );

  const actions: InviteActions = {
    onRevoke: revoke,
    onReissue: (id) => {
      const old = invites.find((invite) => invite.id === id);
      revoke(id);
      return create(old?.role === USER_ROLE.MODERATOR ? USER_ROLE.MODERATOR : USER_ROLE.USER);
    },
    onCreate: create,
  };

  const demoPattern = modalDemo?.pattern ?? MESSAGE_PATTERN.CURRENT;
  const closeModalDemo = () => setModalDemo((current) => current && { ...current, modal: null });

  // Ключ сбрасывает фильтры и страницу панели при смене состояния и роли смотрящего.
  const panelKey = `${dataState}-${viewer}`;
  const panelProps = { invites, viewer, selfName, dataState, actions };

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Таблица приглашений</Title>
      </Group>

      <Text c="dimmed" fz="sm" maw={760}>
        Вкладка «Приглашения» по образцу соседней «Пользователи»: фильтры по статусу и роли,
        сортировка по заголовкам, по 10 строк на странице, клик по строке открывает карточку с
        действиями. По умолчанию — сначала активные, внутри — новые сверху. Варианты разложены по
        осям; каждая ось показана на базовой комбинации T2 + D1 + R1 + L1, меняется только
        сравниваемая. Таблицы — на десктопе и в рамке телефона. Действия работают на общих моках:
        отозванное в одном варианте отозвано во всех. Переключатели ниже меняют сразу все варианты:
        модератор отзывает и перевыпускает только свои приглашения, а выдать может только роль
        «Пользователь». Всё без пометки «Только песочница» показано так, как пойдёт в реализацию.
        Стоит проверить обе темы.
      </Text>

      <SandboxOnly>
        <Stack gap="xs">
          <Group gap="md">
            <SegmentedControl
              value={viewer}
              onChange={(value) => isViewer(value) && setViewer(value)}
              data={[
                { value: VIEWER.ADMIN, label: 'Смотреть как админ' },
                { value: VIEWER.MODERATOR, label: 'Смотреть как модератор' },
              ]}
            />
            <Button
              variant="default"
              leftSection={<ArrowCounterClockwiseIcon />}
              onClick={() => setInvites(MOCK_INVITES)}
            >
              Вернуть моки
            </Button>
          </Group>
          <SegmentedControl
            value={dataState}
            onChange={(value) => isDataState(value) && setDataState(value)}
            data={[
              { value: DATA_STATE.READY, label: 'Данные' },
              { value: DATA_STATE.LOADING, label: 'Загрузка' },
              { value: DATA_STATE.EMPTY, label: 'Пусто' },
              { value: DATA_STATE.NOTHING_FOUND, label: 'Ничего не найдено' },
            ]}
          />
        </Stack>
      </SandboxOnly>

      <DemoSection
        code="T3 + N1 + D1 + R1 + L1 + C1 + M9a"
        title="Итог"
        description="Вкладка «Приглашения» в той же обвязке, что «Пользователи»: фильтры по статусу и роли, сортировка, по 10 строк, сначала активные. Столбцы — Роль · Создал · Статус · Результат: у активного — сколько осталось, у использованного — кто зарегистрировался, у истёкшего — что никто не пришёл, у отозванного — кто отозвал. Клик по строке — карточка «Приглашение от …» с полями; у активного — «Перевыпустить» и «Отозвать» с подтверждением. Создание — роли карточками с описанием прав, затем ссылка и «Ещё одно» / «Готово». Во всех модалках тон — иконкой у заголовка: красный, золотой, серый для нейтральных, зелёный для результата; текст — главное 14, пояснения серым 13."
      >
        <NEUTRAL_COLOR_CONTEXT value={NEUTRAL_COLOR.GRAY}>
          <Group align="flex-start" gap="xl">
            <Stack w={DESKTOP_WIDTH} maw="100%" gap="md">
              <Group justify="flex-end">
                <CreateInviteCards
                  viewer={viewer}
                  pattern={MESSAGE_PATTERN.TITLE_ICON}
                  onCreate={create}
                />
              </Group>
              <InvitesPanel key={panelKey} {...panelProps} config={FINAL_CONFIG} />
            </Stack>
            <PhoneFrame>
              <InvitesPanel key={panelKey} {...panelProps} config={FINAL_CONFIG} narrow />
            </PhoneFrame>
          </Group>
        </NEUTRAL_COLOR_CONTEXT>
      </DemoSection>

      <AxisHeader
        title="T — таблица"
        description="Какие поля в каких столбцах и объединять ли их. На первой странице — все четыре статуса, приглашение от скрипта, истекающее сегодня; на второй — длинное имя. Справа — та же таблица в рамке телефона, она листается вбок."
      />
      {TABLE_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Group align="flex-start" gap="xl">
            <Box w={DESKTOP_WIDTH} maw="100%">
              <InvitesPanel
                key={panelKey}
                {...panelProps}
                config={{ ...BASE_CONFIG, table: value }}
              />
            </Box>
            <PhoneFrame>
              <InvitesPanel
                key={panelKey}
                {...panelProps}
                config={{ ...BASE_CONFIG, table: value }}
                narrow
              />
            </PhoneFrame>
          </Group>
        </DemoSection>
      ))}

      <AxisHeader
        title="N — столбец «Итог» в T3"
        description="«Итог» непонятен без пояснения. Та же T3 с разными названиями столбца — или без него."
      />
      {OUTCOME_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={`T3 + ${code}`}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Group align="flex-start" gap="xl">
            <Box w={DESKTOP_WIDTH} maw="100%">
              <InvitesPanel
                key={panelKey}
                {...panelProps}
                config={{ ...BASE_CONFIG, table: TABLE_LAYOUT.OUTCOME, outcome: value }}
              />
            </Box>
            <PhoneFrame>
              <InvitesPanel
                key={panelKey}
                {...panelProps}
                config={{ ...BASE_CONFIG, table: TABLE_LAYOUT.OUTCOME, outcome: value }}
                narrow
              />
            </PhoneFrame>
          </Group>
        </DemoSection>
      ))}

      <AxisHeader
        title="D — карточка приглашения"
        description="Откройте строки разных статусов: активное, использованное, истёкшее, отозванное. Под «Смотреть как модератор» в чужих активных приглашениях кнопок нет."
      />
      {DRAWER_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Box maw={DESKTOP_WIDTH}>
            <InvitesPanel
              key={panelKey}
              {...panelProps}
              config={{ ...BASE_CONFIG, drawer: value }}
            />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="R — подтверждение отзыва"
        description="Откройте активное приглашение и нажмите «Отозвать»."
      />
      {REVOKE_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Box maw={DESKTOP_WIDTH}>
            <InvitesPanel
              key={panelKey}
              {...panelProps}
              config={{ ...BASE_CONFIG, revoke: value }}
            />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="L — если ссылку потеряли"
        description="Код приглашения сейчас хранится только хешем, и ссылку видно один раз — сразу после создания. Откройте активное приглашение."
      />
      {LINK_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Box maw={DESKTOP_WIDTH}>
            <InvitesPanel key={panelKey} {...panelProps} config={{ ...BASE_CONFIG, link: value }} />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="C — создание приглашения"
        description="Кнопка стоит в шапке страницы «Управление» на вкладке «Приглашения». Созданное появляется в таблицах выше. Переключите «Смотреть как модератор» — у него выбора роли нет."
      />
      {CREATE_VARIANTS.map(({ code, title, description, pros, cons, value: CreateFlow }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Box>
            <CreateFlow viewer={viewer} onCreate={create} />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="M — текст в модалках"
        description="Один паттерн для всех модалок с текстом: и приглашений, и уже существующих в приложении. Модалки приложения — локальные копии с их настоящими текстами; поля и кнопки не меняются, только подача текста. «Новое приглашение» открывается настоящей кнопкой (C1), «Приглашение создано» — после «Создать»."
      />
      {MESSAGE_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Stack gap="sm">
            <Box>
              <CreateInviteCards viewer={viewer} pattern={value} onCreate={create} />
            </Box>
            <SandboxOnly>
              <Group gap="xs">
                {Object.values(DEMO_MODAL).map((modal) => (
                  <Button
                    key={modal}
                    variant="default"
                    size="xs"
                    leftSection={<ArrowSquareOutIcon />}
                    onClick={() => setModalDemo({ pattern: value, modal })}
                  >
                    {getDemoModalLabel(modal)}
                  </Button>
                ))}
              </Group>
            </SandboxOnly>
          </Stack>
        </DemoSection>
      ))}

      <AxisHeader
        title="M9 — карта тонов и иконок"
        description="Тон совпадает с цветом главной кнопки и тем, насколько действие обратимо: danger — необратимо или бьёт по чужому аккаунту, warning — обратимо, но что-то сбросится, откроется или перезагрузится, neutral — обычная форма, success — результат. Иконка повторяет иконку главной кнопки, если та про смысл, иначе — предмет модалки; крестика в заголовке нет — рядом с крестиком закрытия его не различить. На внутренних шагах («Введите код», «Закладки на …») на месте иконки — кнопка «Назад». Варианты отличаются только цветом нейтрального тона."
      />
      {NEUTRAL_VARIANTS.map(({ code, title, description, pros, cons, value }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <NEUTRAL_COLOR_CONTEXT value={value}>
            <Stack gap="sm">
              <ModalHeadersGrid neutral={value} />
              <Box>
                <CreateInviteCards
                  viewer={viewer}
                  pattern={MESSAGE_PATTERN.TITLE_ICON}
                  onCreate={create}
                />
              </Box>
              <SandboxOnly>
                <Group gap="xs">
                  {Object.values(DEMO_MODAL).map((modal) => (
                    <Button
                      key={modal}
                      variant="default"
                      size="xs"
                      leftSection={<ArrowSquareOutIcon />}
                      onClick={() =>
                        setModalDemo({ pattern: MESSAGE_PATTERN.TITLE_ICON, neutral: value, modal })
                      }
                    >
                      {getDemoModalLabel(modal)}
                    </Button>
                  ))}
                </Group>
              </SandboxOnly>
            </Stack>
          </NEUTRAL_COLOR_CONTEXT>
        </DemoSection>
      ))}

      <NEUTRAL_COLOR_CONTEXT value={modalDemo?.neutral ?? NEUTRAL_COLOR.ACCENT}>
        <RevokeModal
          invite={modalDemo?.modal === DEMO_MODAL.REVOKE ? REVOKE_DEMO_INVITE : null}
          pattern={demoPattern}
          onClose={closeModalDemo}
          onConfirm={closeModalDemo}
        />
        <DemoBlockUserModal
          key={`block-${modalDemo?.pattern}`}
          opened={modalDemo?.modal === DEMO_MODAL.BLOCK}
          pattern={demoPattern}
          onClose={closeModalDemo}
        />
        <DemoDeleteUserModal
          key={`delete-${modalDemo?.pattern}`}
          opened={modalDemo?.modal === DEMO_MODAL.DELETE_USER}
          pattern={demoPattern}
          onClose={closeModalDemo}
        />
        <DemoClearCacheModal
          opened={modalDemo?.modal === DEMO_MODAL.CLEAR_CACHE}
          pattern={demoPattern}
          onClose={closeModalDemo}
        />
        <DemoAgeConfirmModal
          opened={modalDemo?.modal === DEMO_MODAL.AGE}
          pattern={demoPattern}
          onClose={closeModalDemo}
        />
        <DemoResetFiltersModal
          opened={modalDemo?.modal === DEMO_MODAL.RESET_FILTERS}
          pattern={demoPattern}
          onClose={closeModalDemo}
        />
      </NEUTRAL_COLOR_CONTEXT>
    </Stack>
  );
}

export default PlaygroundInvitesTable;
