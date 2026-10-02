import { useState } from 'react';
import { Box, Button, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { ArrowCounterClockwiseIcon, ProhibitIcon, TrashIcon } from '@phosphor-icons/react';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import AxisHeader from './components/AxisHeader';
import BlockModal from './components/BlockModal';
import DeleteModal from './components/DeleteModal';
import PhoneFrame from './components/PhoneFrame';
import PlacementShell from './components/PlacementShell';
import UsersPanel from './components/UsersPanel';
import { BASE_CONFIG, FINAL_CONFIG, MOCK_USERS, MODAL_DEMO_USER_ID, getSelfId } from './mocks';
import {
  ACTIONS_MODE,
  BLOCK_FORM,
  DELETE_CONFIRM,
  DESKTOP_WIDTH,
  FILTERS_LAYOUT,
  MOBILE_LAYOUT,
  PLACEMENT,
  STAFF_ROLE,
  TABLE_LAYOUT,
  USER_STATUS,
  type ActionsMode,
  type BlockForm,
  type DeleteConfirm,
  type FiltersLayout,
  type MobileLayout,
  type MockUser,
  type Placement,
  type StaffRole,
  type TableLayout,
  type UserActions,
  type Variant,
} from './models';

const PLACEMENT_VARIANTS: Variant<Placement>[] = [
  {
    code: 'P1',
    title: 'Вкладка в настройках',
    description:
      'Четвёртая вкладка рядом с «Общими», «Источниками» и «Читалкой», видна только персоналу. Не нужен новый пункт меню, но личные предпочтения соседствуют с управлением чужими аккаунтами, а набор вкладок начинает зависеть от роли. На телефоне четыре вкладки в строку уже не влезают.',
    value: PLACEMENT.SETTINGS_TAB,
  },
  {
    code: 'P2',
    title: 'Своя страница /users',
    description:
      'Как «Приглашения»: отдельный пункт меню аватара, RequireStaff, таблица во всю ширину. Настройки не меняются, но меню растёт ещё на пункт, а люди и приглашения остаются на двух разных страницах.',
    value: PLACEMENT.PAGE,
  },
  {
    code: 'P3',
    title: 'Служебная страница: «Пользователи» и «Приглашения»',
    description:
      'Одна страница «Управление» с двумя вкладками вместо /invites: всё про людей в одном месте, пункт меню один, настройки остаются личными. Кнопка «Создать приглашение» видна только на своей вкладке. Цена — перенос готовой страницы приглашений.',
    value: PLACEMENT.STAFF_PAGE,
  },
];

const TABLE_VARIANTS: Variant<TableLayout>[] = [
  {
    code: 'T0',
    title: 'Как приглашения: столбец на поле',
    description:
      'Имя с аватаром, почта, роль, статус, причина, кто пригласил, регистрация, вход — каждое отдельно. Всё видно сразу, но таблица шире экрана ноутбука и уходит в горизонтальный скролл.',
    value: TABLE_LAYOUT.SEPARATE,
  },
  {
    code: 'T1',
    title: 'Объединённые ячейки',
    description:
      'Аватар, имя и почта — одна ячейка «Пользователь»; срок блокировки и причина — второй и третьей строкой под бейджем статуса. Остальные поля в своих столбцах. Помещается в ширину без скролла.',
    value: TABLE_LAYOUT.MERGED,
  },
  {
    code: 'T2',
    title: 'Три столбца',
    description:
      'Роль и статус — в одной ячейке, регистрация и вход — двумя строками в «Датах». «Пригласил» в таблице нет, причина — тултипом на бейдже. Самая узкая таблица, но меньше видно без наведения.',
    value: TABLE_LAYOUT.COMPACT,
  },
  {
    code: 'T3',
    title: 'T1 с ролью у имени и датами одной ячейкой',
    description:
      'Роль персонала — бейджем рядом с именем (у обычных пользователей его нет, так админ и модераторы выделяются, а строки не шумят), регистрация и вход — двумя строками, как в T2. Статус с причиной и «Пригласил» остаются своими столбцами, как в T1.',
    value: TABLE_LAYOUT.ROLE_IN_USER,
  },
];

const ACTIONS_VARIANTS: Variant<ActionsMode>[] = [
  {
    code: 'A1',
    title: 'Меню «…» в строке',
    description:
      'Все действия — в меню: роль, блокировка, удаление (отделено чертой и красным). Чего смотрящему нельзя — того в меню нет; нечего показать — нет и кнопки. Таблица остаётся спокойной.',
    value: ACTIONS_MODE.MENU,
  },
  {
    code: 'A2',
    title: 'Роль — Select в ячейке',
    description:
      'Админ меняет роль прямо в столбце «Роль», в один клик; у модератора и для недоступных строк там остаётся бейдж. Блокировка и удаление — в «…». Удобно, но роль легко сменить случайно, без подтверждения.',
    value: ACTIONS_MODE.ROLE_SELECT,
  },
  {
    code: 'A3',
    title: 'Клик по строке → drawer',
    description:
      'В таблице нет кнопок вовсе: клик по строке открывает карточку пользователя справа (на телефоне — снизу) со всеми полями, полной причиной блокировки и действиями кнопками. На любое действие — лишний клик.',
    value: ACTIONS_MODE.DRAWER,
  },
];

const BLOCK_VARIANTS: Variant<BlockForm>[] = [
  {
    code: 'B1',
    title: '«На срок / Навсегда», потом срок',
    description:
      'Сначала главный выбор переключателем, затем — чипы 1 / 7 / 30 дней или своя дата. Все сроки видны без раскрытия списка.',
    value: BLOCK_FORM.SEGMENTED,
  },
  {
    code: 'B2',
    title: 'Один список «Срок»',
    description:
      'Сроки и «Навсегда» — пункты одного Select, своя дата — последним пунктом. Компактнее, но варианты видны только после клика.',
    value: BLOCK_FORM.SELECT,
  },
];

const DELETE_VARIANTS: Variant<DeleteConfirm>[] = [
  {
    code: 'D1',
    title: 'Ввести имя пользователя',
    description:
      'Кнопка «Удалить» активна, только когда имя введено (регистр не важен). Удаление необратимо, лишние секунды здесь уместны.',
    value: DELETE_CONFIRM.TYPE_USERNAME,
  },
  {
    code: 'D2',
    title: 'Карточка и «Удалить навсегда»',
    description:
      'Без ввода: в модалке — кого удаляем (аватар, почта, дата регистрации) и что пропадёт. Быстрее, защита — только в тексте кнопки.',
    value: DELETE_CONFIRM.SIMPLE,
  },
  {
    code: 'D3',
    title: 'Карточка и ввод имени',
    description:
      'Карточка из D2 — видно, кого удаляем, — и поле из D1: «Удалить» активна, только когда имя введено.',
    value: DELETE_CONFIRM.CARD_AND_USERNAME,
  },
];

const FILTERS_VARIANTS: Variant<FiltersLayout>[] = [
  {
    code: 'F1',
    title: 'Поиск и два списка',
    description:
      'Поиск по имени и почте, роль и статус — двумя Select в одной строке. Компактно; выбранный фильтр видно по значению в поле.',
    value: FILTERS_LAYOUT.SELECTS,
  },
  {
    code: 'F2',
    title: 'Статусы переключателем',
    description:
      'Роль остаётся списком рядом с поиском, а статусы вынесены в SegmentedControl под ним: «Заблокированные» и «Удаляются» — в один клик. На телефоне переключатель листается вбок.',
    value: FILTERS_LAYOUT.SEGMENTED,
  },
];

const MOBILE_VARIANTS: Variant<MobileLayout>[] = [
  {
    code: 'M1',
    title: 'Таблица со скроллом вбок',
    description:
      'Та же таблица, что на десктопе, в горизонтальном скролле — как «Приглашения» сейчас. Ничего нового, но видно только первые столбцы.',
    value: MOBILE_LAYOUT.SCROLL,
  },
  {
    code: 'M2',
    title: 'Карточки',
    description:
      'Строка становится карточкой: кто, роль и статус бейджами, срок и причина, даты одной строкой, «…» справа. Всё видно без скролла вбок.',
    value: MOBILE_LAYOUT.CARDS,
  },
];

function PlaygroundUsersAdmin() {
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [viewer, setViewer] = useState<StaffRole>(STAFF_ROLE.ADMIN);
  const [blockDemo, setBlockDemo] = useState<BlockForm | null>(null);
  const [deleteDemo, setDeleteDemo] = useState<DeleteConfirm | null>(null);

  const selfId = getSelfId(viewer);
  // Если демо-пользователя удалили в одном из вариантов, модалки всё равно открываются на нём.
  const isDemoUser = (user: MockUser) => user.id === MODAL_DEMO_USER_ID;
  const demoUser = users.find(isDemoUser) ?? MOCK_USERS.find(isDemoUser) ?? null;

  const updateUser = (id: string, patch: Partial<MockUser>) =>
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...patch } : user)));

  const actions: UserActions = {
    onRoleChange: (id, role) => updateUser(id, { role }),
    onBlock: (id, { until, reason }) =>
      updateUser(id, { status: USER_STATUS.BLOCKED, blockedUntil: until, blockReason: reason }),
    onUnblock: (id) =>
      updateUser(id, { status: USER_STATUS.ACTIVE, blockedUntil: null, blockReason: null }),
    onDelete: (id) => setUsers((current) => current.filter((user) => user.id !== id)),
  };

  const isViewer = (value: string): value is StaffRole =>
    Object.values(STAFF_ROLE).some((role) => role === value);

  const panelProps = { users, viewer, selfId, actions };

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Пользователи</Title>
      </Group>

      <Text c="dimmed" fz="sm" maw={760}>
        Экран для админа и модераторов: все пользователи постранично, роль, блокировка, удаление.
        Варианты разложены по осям; каждая показана на базовой комбинации T1 + A1 + F1 + B1 + D1 +
        M2, меняется только сравниваемая ось. Действия работают на общих моках — заблокированный в
        одном варианте заблокирован во всех. Переключатель «Смотреть как» показывает, что видит
        модератор: только «Заблокировать» и «Разблокировать» у обычных пользователей. Всё без
        пометки «Только песочница» показано так, как пойдёт в реализацию. Стоит проверить обе темы.
      </Text>

      <SandboxOnly>
        <Group gap="md">
          <SegmentedControl
            value={viewer}
            onChange={(value) => isViewer(value) && setViewer(value)}
            data={[
              { value: STAFF_ROLE.ADMIN, label: 'Смотреть как админ' },
              { value: STAFF_ROLE.MODERATOR, label: 'Смотреть как модератор' },
            ]}
          />
          <Button
            variant="default"
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => setUsers(MOCK_USERS)}
          >
            Вернуть моки
          </Button>
        </Group>
      </SandboxOnly>

      <DemoSection
        code="P3 + T3 + A3 + B2 + D3 + F1 + M1"
        title="Итог"
        description="Служебная страница «Управление» с вкладками «Пользователи» и «Приглашения». В таблице роль персонала — бейджем у имени, даты — одной ячейкой; кнопок в строках нет: клик по строке открывает карточку пользователя с действиями. Блокировка — одним списком «Срок», удаление — карточкой и вводом имени. Над таблицей — поиск и два списка; на телефоне та же таблица листается вбок, а карточка выезжает снизу."
      >
        <Group align="flex-start" gap="xl">
          <Box w={DESKTOP_WIDTH} maw="100%">
            <PlacementShell placement={PLACEMENT.STAFF_PAGE}>
              <UsersPanel {...panelProps} config={FINAL_CONFIG} />
            </PlacementShell>
          </Box>
          <PhoneFrame>
            <PlacementShell placement={PLACEMENT.STAFF_PAGE}>
              <UsersPanel {...panelProps} config={FINAL_CONFIG} narrow />
            </PlacementShell>
          </PhoneFrame>
        </Group>
      </DemoSection>

      <AxisHeader
        title="P — где живёт экран"
        description="Содержимое одно и то же (T1 + A1 + F1), меняется только место и шапка."
      />
      {PLACEMENT_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Box maw={DESKTOP_WIDTH}>
            <PlacementShell placement={value}>
              <UsersPanel {...panelProps} config={BASE_CONFIG} />
            </PlacementShell>
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="T — таблица"
        description="Какие поля в каких столбцах. На первой странице — все статусы, обе роли персонала, длинное имя, «ни разу не входил» и приглашённый скриптом."
      />
      {TABLE_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Box maw={DESKTOP_WIDTH}>
            <UsersPanel {...panelProps} config={{ ...BASE_CONFIG, table: value }} />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="A — действия"
        description="Как добраться до роли, блокировки и удаления. Переключите «Смотреть как модератор», чтобы увидеть, что остаётся у модератора."
      />
      {ACTIONS_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Box maw={DESKTOP_WIDTH}>
            <UsersPanel {...panelProps} config={{ ...BASE_CONFIG, actions: value }} />
          </Box>
        </DemoSection>
      ))}

      <AxisHeader
        title="B — блокировка"
        description="Срок и необязательная причина. Причину видят персонал в таблице и сам пользователь при попытке войти."
      />
      {BLOCK_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <SandboxOnly>
            <Button
              variant="default"
              leftSection={<ProhibitIcon />}
              onClick={() => setBlockDemo(value)}
            >
              Открыть модалку блокировки
            </Button>
          </SandboxOnly>
        </DemoSection>
      ))}

      <AxisHeader
        title="D — удаление"
        description="Админ удаляет сразу, без отсрочки — отсрочка остаётся только у удаления, которое человек запросил сам."
      />
      {DELETE_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <SandboxOnly>
            <Button
              variant="default"
              leftSection={<TrashIcon />}
              onClick={() => setDeleteDemo(value)}
            >
              Открыть модалку удаления
            </Button>
          </SandboxOnly>
        </DemoSection>
      ))}

      <AxisHeader
        title="F — поиск и фильтры"
        description="Фильтры сбрасывают страницу на первую. Рядом, в рамке телефона, — тот же вариант, когда никого не нашли."
      />
      {FILTERS_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Group align="flex-start" gap="xl">
            <Box w={DESKTOP_WIDTH} maw="100%">
              <UsersPanel {...panelProps} config={{ ...BASE_CONFIG, filters: value }} />
            </Box>
            <PhoneFrame>
              <UsersPanel
                {...panelProps}
                config={{ ...BASE_CONFIG, filters: value }}
                narrow
                initialQuery="nobody"
              />
            </PhoneFrame>
          </Group>
        </DemoSection>
      ))}

      <AxisHeader title="M — телефон" description="Рамка 375px." />
      {MOBILE_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <PhoneFrame>
            <UsersPanel {...panelProps} config={{ ...BASE_CONFIG, mobile: value }} narrow />
          </PhoneFrame>
        </DemoSection>
      ))}

      <BlockModal
        key={`block-${blockDemo}`}
        user={blockDemo ? demoUser : null}
        form={blockDemo ?? BLOCK_FORM.SEGMENTED}
        onClose={() => setBlockDemo(null)}
        onConfirm={(payload) => {
          actions.onBlock(MODAL_DEMO_USER_ID, payload);
          setBlockDemo(null);
        }}
      />
      <DeleteModal
        key={`delete-${deleteDemo}`}
        user={deleteDemo ? demoUser : null}
        confirm={deleteDemo ?? DELETE_CONFIRM.TYPE_USERNAME}
        onClose={() => setDeleteDemo(null)}
        onConfirm={() => setDeleteDemo(null)}
      />
    </Stack>
  );
}

export default PlaygroundUsersAdmin;
