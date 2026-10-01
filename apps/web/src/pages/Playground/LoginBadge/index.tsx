import { Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import VariantDemo from './components/VariantDemo';
import {
  DESKTOP_WIDTH,
  ICON_SET,
  MARK_VIEW,
  MOBILE_FRAME_WIDTH,
  type IconSet,
  type MarkView,
} from './models';

type Variant = {
  code: string;
  title: string;
  description: string;
  view: MarkView;
  withLegend: boolean;
  /** В профиле пометка за названием, как в настройках. */
  isProfileMarkInTitle?: boolean;
};

type IconVariant = {
  code: string;
  title: string;
  description: string;
  iconSet: IconSet;
};

const VARIANTS: Variant[] = [
  {
    code: 'L0',
    title: 'Как сейчас',
    description:
      'Бейдж S1 сразу за названием, полным текстом. Бейдж не сжимается, поэтому на телефоне от названия остаётся пара букв, а «Нужен повторный вход» съедает его целиком.',
    view: MARK_VIEW.BADGE,
    withLegend: false,
  },
  {
    code: 'L1',
    title: 'Иконка вместо бейджа',
    description:
      'За названием только цветная иконка: закрытый замок — вход обязателен, открытый — по желанию, восклицательный знак — войти заново. Полный текст — в подсказке на десктопе; на телефоне смысл передают только цвет и форма. Название получает почти всю ширину.',
    view: MARK_VIEW.ICON,
    withLegend: false,
  },
  {
    code: 'L2',
    title: 'Иконка и легенда',
    description:
      'Иконки L1 и строка пояснений под списком — только с пометками, которые в нём есть. Смысл виден без наведения, ценой одной строки под блоком.',
    view: MARK_VIEW.ICON,
    withLegend: true,
  },
  {
    code: 'L2a',
    title: 'L2 в muted: квадрат',
    description:
      'Иконки L2 в той же подложке, что у бейджа: полупрозрачный тон и обводка того же цвета. Размер прежний (22px), поэтому пометка заметнее, чем голый тон L2. В легенде — те же подложки. В профиле пометка тоже стоит за названием, как в настройках, а правая часть строки пустая.',
    view: MARK_VIEW.ICON_MUTED,
    withLegend: true,
    isProfileMarkInTitle: true,
  },
  {
    code: 'L2b',
    title: 'L2 в muted: бейдж без текста',
    description:
      'Muted-подложка высотой с бейдж xs (16px), иконка меньше. Ближе всего к нынешнему S1 — тот же бейдж, только без слов, — и тише L2a: строка названия не подрастает. В профиле — за названием, как в L2a.',
    view: MARK_VIEW.ICON_PILL,
    withLegend: true,
    isProfileMarkInTitle: true,
  },
  {
    code: 'L2c',
    title: 'L2 в muted: кружок',
    description:
      'Как L2a, но круглая. Читается как значок статуса, а не как кнопка рядом с названием. В профиле — за названием, как в L2a.',
    view: MARK_VIEW.ICON_ROUND,
    withLegend: true,
    isProfileMarkInTitle: true,
  },
  {
    code: 'L3a',
    title: 'Короткий бейдж: «Вход»',
    description:
      'Бейдж остаётся, но с одним словом «Вход» и иконкой у всех трёх пометок. Различаются иконкой и цветом, «по желанию» — контуром. Короче всех текстовых вариантов, но без легенды «Вход» сам по себе не говорит, обязателен ли он.',
    view: MARK_VIEW.WORD,
    withLegend: false,
  },
  {
    code: 'L3b',
    title: 'Короткий бейдж по сути',
    description:
      'Бейдж с иконкой, который читается сам: «Нужен вход», «Можно войти», «Войти заново». Заметно короче нынешних текстов и не требует легенды, но на телефоне всё ещё отнимает у названия место.',
    view: MARK_VIEW.SHORT,
    withLegend: false,
  },
  {
    code: 'L4',
    title: 'Бейдж уступает место',
    description:
      'Пока строка шире 480px — полный бейдж как сейчас; в строке уже бейдж сворачивается в иконку L1. Порог считается по ширине самой строки, а не окна, поэтому в рамке телефона видно честно. Десктоп не меняется.',
    view: MARK_VIEW.ADAPTIVE,
    withLegend: false,
  },
  {
    code: 'L5',
    title: 'Значок на логотипе',
    description:
      'В строке названия пометки нет совсем: цветной кружок с иконкой на углу логотипа источника. Название и правая часть строки свободны, в профиле справа пусто. Под списком — легенда, как в L2.',
    view: MARK_VIEW.AVATAR,
    withLegend: true,
  },
];

const ICON_VARIANTS: IconVariant[] = [
  {
    code: 'I0',
    title: 'Замок и открытый замок',
    description:
      'Как в L2b сейчас. В 11px силуэты почти совпадают, а открытый замок читается как «вход выполнен» — различает их только цвет.',
    iconSet: ICON_SET.LOCKS,
  },
  {
    code: 'I1',
    title: 'Замок и дверь',
    description:
      'Обязателен — замок («закрыто»), по желанию — стрелка в дверь («можно войти»). Силуэты разные, и ни одна иконка не похожа на «уже вошли».',
    iconSet: ICON_SET.LOCK_SIGN_IN,
  },
  {
    code: 'I2',
    title: 'Ключ и дверь',
    description:
      'Замков нет совсем: обязателен — ключ («нужен ключ»), по желанию — дверь. Ничто не намекает на открытое или закрытое состояние.',
    iconSet: ICON_SET.KEY_SIGN_IN,
  },
  {
    code: 'I3',
    title: 'Замок и подарок',
    description:
      'По желанию подан через пользу: вход что-то даст (главы для зарегистрированных, купленные главы). Самый непохожий на замок силуэт.',
    iconSet: ICON_SET.LOCK_GIFT,
  },
  {
    code: 'I4',
    title: 'Замок и человек с плюсом',
    description:
      'По желанию — «можно добавить аккаунт»: ближе всего к тому, что делается в профиле. Силуэт заметно сложнее остальных в 11px.',
    iconSet: ICON_SET.LOCK_USER_PLUS,
  },
];

/** Пометка о входе в строке источника: на телефоне бейдж съедает название. */
function PlaygroundLoginBadge() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Пометка о входе</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Каждый вариант — на двух экранах: «Настройки → Источники» и «Профиль → Аккаунты источников»,
        в колонке настроек {DESKTOP_WIDTH}px и в рамке телефона {MOBILE_FRAME_WIDTH}px. В списке
        есть все три пометки и источники без пометки; в настройках у вошедшего ReadManga пометки
        нет, в профиле — есть. Подписи «Десктоп» и «Телефон» и рамки — обвязка песочницы, всё внутри
        показано так, как пойдёт в реализацию. Посмотрите обе цветовые схемы.
      </Text>
      {VARIANTS.map(
        ({ code, title, description, view, withLegend, isProfileMarkInTitle = false }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <VariantDemo
              view={view}
              iconSet={ICON_SET.LOCKS}
              withLegend={withLegend}
              isProfileMarkInTitle={isProfileMarkInTitle}
            />
          </DemoSection>
        ),
      )}
      <Stack gap="xs">
        <Title order={3}>Иконки для L2b</Title>
        <Text c="dimmed" fz="sm" maw={760}>
          Форма L2b, меняются только иконки «Вход обязателен» и «Вход по желанию»; «Нужен повторный
          вход» везде прежний.
        </Text>
      </Stack>
      {ICON_VARIANTS.map(({ code, title, description, iconSet }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <VariantDemo
            view={MARK_VIEW.ICON_PILL}
            iconSet={iconSet}
            withLegend
            isProfileMarkInTitle
          />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundLoginBadge;
