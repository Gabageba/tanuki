import { Box, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import {
  ACCOUNTS_LAYOUT,
  LOCK_REASON,
  MARK_PLACEMENT,
  type AccountsLayout,
  type LockReason,
  type MarkPlacement,
} from './models';
import AccountsDemo from './components/AccountsDemo';
import ImportDemo from './components/ImportDemo';
import SettingsSourcesDemo from './components/SettingsSourcesDemo';
import SourceLockedDemo from './components/SourceLockedDemo';

type Variant<Value> = {
  code: string;
  title: string;
  description: string;
  value: Value;
};

const SETTINGS_VARIANTS: Variant<MarkPlacement>[] = [
  {
    code: 'S1',
    title: 'Бейдж у названия',
    description:
      'Пометка стоит сразу за названием: цветная — «Нужен вход» и «Войдите заново», контурная серая — «Вход по желанию».',
    value: MARK_PLACEMENT.TITLE,
  },
  {
    code: 'S2',
    title: 'Текст во второй строке',
    description:
      'Пометка — продолжение строки с доменом. Спокойнее бейджа, список выглядит ровнее, но и заметна меньше.',
    value: MARK_PLACEMENT.DESCRIPTION,
  },
  {
    code: 'S3',
    title: 'Иконка перед выключателем',
    description:
      'Только иконка с подсказкой: замок — нужен вход, предупреждение — войти заново, стрелка — вход по желанию. Самый компактный.',
    value: MARK_PLACEMENT.ACTION,
  },
];

const ACCOUNTS_VARIANTS: Variant<AccountsLayout>[] = [
  {
    code: 'P1',
    title: 'Бейдж обязательности + польза текстом',
    description:
      'У каждого источника справа бейдж «Вход обязателен» / «Вход по желанию», под названием — фраза, что даст вход.',
    value: ACCOUNTS_LAYOUT.ROW_BADGE,
  },
  {
    code: 'P2',
    title: 'Обязательность в шапке, польза чипами',
    description:
      'Если у всех источников семейства требование одно, оно названо в шапке; бейдж в строке появляется, только когда сайты различаются (LibSocial). Польза — чипы под названием.',
    value: ACCOUNTS_LAYOUT.HEADER_SUMMARY,
  },
  {
    code: 'P3',
    title: 'Иконки с подсказками',
    description:
      'Под названием остаётся домен, справа — иконки пользы и замок: закрытый — вход обязателен, открытый — по желанию. Текст только в подсказках.',
    value: ACCOUNTS_LAYOUT.BENEFIT_ICONS,
  },
];

const LOCK_VARIANTS: Variant<LockReason>[] = [
  {
    code: 'T1',
    title: 'Источник закрыт',
    description: 'Вход обязателен, аккаунт не привязан — то, что экран показывает сейчас.',
    value: LOCK_REASON.SOURCE,
  },
  {
    code: 'T2',
    title: 'Сессия истекла',
    description: 'Аккаунт привязан, но источник его больше не принимает.',
    value: LOCK_REASON.RELOGIN,
  },
  {
    code: 'T3',
    title: 'Тайтл только для вошедших',
    description: 'Источник открыт без входа, но этот тайтл отдаёт только авторизованным.',
    value: LOCK_REASON.TITLE,
  },
];

/** Настройка источников: что остаётся в настройках, что уходит в профиль и как помечен вход. */
function PlaygroundSourcesSetup() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Настройка источников</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Данные одни на все макеты: в Grouple вход выполнен, в LibSocial сессия истекла, в AllHentai
        и Реманге аккаунта нет, у Desu входа нет вовсе. У MangaLib и Реманги вход необязателен.
      </Text>

      <Title order={3}>Настройки → Источники</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Плоский список: порядок перетаскиванием и включение. Варианты отличаются тем, где стоит
        пометка о входе.
      </Text>
      {SETTINGS_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <Box maw={560}>
            <SettingsSourcesDemo placement={value} />
          </Box>
        </DemoSection>
      ))}

      <Title order={3}>Профиль → Аккаунты источников</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Семейства с шапкой аккаунта, как сейчас, без выключателей. Варианты отличаются тем, как
        источник сообщает, обязателен ли вход и что он даёт.
      </Text>
      {ACCOUNTS_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <AccountsDemo layout={value} />
        </DemoSection>
      ))}

      <Title order={3}>Экран «закрыто»</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Тот же StatusScreen, что сейчас показывает «Источник закрыт», но под три причины: текст
        называет источник и сеть, кнопка — куда именно войти.
      </Text>
      {LOCK_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <SourceLockedDemo reason={value} />
        </DemoSection>
      ))}

      <Title order={3}>Профиль → Данные</Title>
      <DemoSection
        code="I1"
        title="Импорт закладок с источника"
        description="Отдельная строка «Импорт из источника». Кнопка открывает выбор источника, после чтения закладок его сменяет вторая модалка — выбор тайтлов."
      >
        <Box maw={560}>
          <ImportDemo />
        </Box>
      </DemoSection>
    </Stack>
  );
}

export default PlaygroundSourcesSetup;
