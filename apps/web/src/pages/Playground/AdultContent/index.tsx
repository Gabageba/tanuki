import { useState, type ReactNode } from 'react';
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { getTermForms, getTermLabel } from './lib';
import DemoSection from '../components/DemoSection';
import {
  BLUR_STYLE,
  COPY_VARIANT,
  COVER_PREVIEW,
  DESCRIPTION_MODE,
  FRAMING,
  TERM,
  GROUP_PREVIEW,
  HEADING_VARIANT,
  LOCK_SCREEN,
  NESTED_LAYOUT,
  SWITCH_WHEN_LOCKED,
  type BlurStyle,
  type DescriptionMode,
  type FlatConfig,
  type Framing,
  type FramingRenderProps,
  type Term,
  type CopyVariant,
  type CoverPreview,
  type LockScreen,
  type NestedLayout,
} from './models';
import AgeConfirmDemo from './components/AgeConfirmDemo';
import BlurStyleDemo from './components/BlurStyleDemo';
import DeviceFrames from './components/DeviceFrames';
import FinalDemo from './components/FinalDemo';
import FramingDemo from './components/FramingDemo';
import FramingException from './components/FramingException';
import FramingLevels from './components/FramingLevels';
import FramingObjects from './components/FramingObjects';
import FramingTwoSwitches from './components/FramingTwoSwitches';
import SandboxOnly from '../components/SandboxOnly';
import LockScreenDemo from './components/LockScreenDemo';
import SettingsBlockCurrent from './components/SettingsBlockCurrent';
import SettingsBlockFlat from './components/SettingsBlockFlat';
import SettingsBlockNested from './components/SettingsBlockNested';
import SettingsBlockSegmented from './components/SettingsBlockSegmented';
import SettingsVariantDemo from './components/SettingsVariantDemo';

type Variant<Value> = {
  code: string;
  title: string;
  description: string;
  value: Value;
};

type NestedConfig = {
  layout: NestedLayout;
  copy: CopyVariant;
  preview: CoverPreview;
};

const SETTINGS_VARIANTS: Variant<NestedConfig>[] = [
  {
    code: 'R1',
    title: 'Вложенная строка прячется',
    description:
      'Главный тумблер «Показывать 18+» включает всё сразу — и источники 18+, и тайтлы 18+ на обычных источниках без размытия. «Размывать обложки» нужна только при выключенном 18+, поэтому при включённом её нет.',
    value: {
      layout: NESTED_LAYOUT.COLLAPSE,
      copy: COPY_VARIANT.PLAIN,
      preview: COVER_PREVIEW.INLINE,
    },
  },
  {
    code: 'R2',
    title: 'Вложенная строка неактивна',
    description:
      'То же, но строка не исчезает, а гаснет, и в описании сказано почему. Блок не прыгает по высоте, и видно, что опция есть, — но неактивный переключатель легко принять за сломанный.',
    value: {
      layout: NESTED_LAYOUT.DISABLED,
      copy: COPY_VARIANT.PLAIN,
      preview: COVER_PREVIEW.INLINE,
    },
  },
];

const COPY_VARIANTS: Variant<NestedConfig>[] = [
  {
    code: 'T2',
    title: 'Описание — текущее состояние',
    description:
      'Описание меняется вместе с тумблером и говорит, что происходит прямо сейчас: «Источников 18+ нет в списках и поиске», «Тайтлы 18+ … видны как есть». Ничего не пересказывает за заголовком.',
    value: {
      layout: NESTED_LAYOUT.COLLAPSE,
      copy: COPY_VARIANT.STATEFUL,
      preview: COVER_PREVIEW.INLINE,
    },
  },
  {
    code: 'T3',
    title: 'Пояснение под группой',
    description:
      'У строк только короткие заголовки, а связь двух настроек объяснена одним абзацем под рамкой. Самые чистые строки, но абзац надо прочитать.',
    value: {
      layout: NESTED_LAYOUT.COLLAPSE,
      copy: COPY_VARIANT.GROUP_CAPTION,
      preview: COVER_PREVIEW.INLINE,
    },
  },
];

const PREVIEW_VARIANTS: Variant<NestedConfig>[] = [
  {
    code: 'P2',
    title: 'Без мини-обложки',
    description:
      'Строка без миниатюры, как у остальных настроек, но связь «тумблер → обложка» не видна совсем.',
    value: {
      layout: NESTED_LAYOUT.COLLAPSE,
      copy: COPY_VARIANT.PLAIN,
      preview: COVER_PREVIEW.NONE,
    },
  },
];

const FLAT_SETTINGS_VARIANTS: Variant<FlatConfig>[] = [
  {
    code: 'R3',
    title: 'Без отступа, блокируется и выключается',
    description:
      'Строка «Размывать обложки» на месте и без отступа. Пока 18+ включён, она гаснет, а тумблер стоит в «выкл.» — размытия ведь и правда нет. Выключили 18+ — вернулся прежний выбор.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.SHOW,
      preview: GROUP_PREVIEW.ROW,
    },
  },
  {
    code: 'R4',
    title: 'Без отступа, блокируется в прежнем положении',
    description:
      'То же, но заблокированный тумблер помнит выбор и стоит включённым, хотя размытия нет. Для сравнения с R3: «включено, но не работает» читается хуже.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.KEEP,
      heading: HEADING_VARIANT.SHOW,
      preview: GROUP_PREVIEW.ROW,
    },
  },
];

const HEADING_VARIANTS: Variant<FlatConfig>[] = [
  {
    code: 'H1',
    title: '«Показывать 18+» / «Размывать обложки»',
    description:
      'Коротко, глаголами. Описание главного перечисляет, что именно включается; вложенного — что будет с тайтлом.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.SHOW,
      preview: GROUP_PREVIEW.ROW,
    },
  },
  {
    code: 'H2',
    title: '«Контент для взрослых» / «Прятать обложки 18+»',
    description:
      'Главный назван существительным, без «18+» дважды подряд. Описания говорят о последствиях выключенного состояния.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.ADULT_CONTENT,
      preview: GROUP_PREVIEW.ROW,
    },
  },
  {
    code: 'H3',
    title: '«Разрешить 18+» / «Размывать, пока 18+ запрещён»',
    description:
      'Связь видна прямо в заголовке вложенной строки — понятно без описаний, почему она гаснет. Но заголовок длинный.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.ALLOW,
      preview: GROUP_PREVIEW.ROW,
    },
  },
  {
    code: 'H4',
    title: '«Показывать 18+ контент» / «Размывать обложки»',
    description:
      'Как на референсе: описание главного рассказывает, что происходит, когда он выключен, — и про источники, и про тайтлы.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.SHOW_CONTENT,
      preview: GROUP_PREVIEW.ROW,
    },
  },
];

const GROUP_PREVIEW_VARIANTS: Variant<FlatConfig>[] = [
  {
    code: 'P3',
    title: 'Строка-превью в группе',
    description:
      'Последняя строка группы: обычная обложка и две 18+ при текущих настройках, меняются вместе с тумблерами. В приложении на месте сгенерированных — нейтральные картинки-заглушки, не реальные тайтлы.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.SHOW,
      preview: GROUP_PREVIEW.ROW,
    },
  },
  {
    code: 'P3b',
    title: 'Строка-превью + дата подтверждения',
    description:
      'При включённом 18+ подпись добавляет «Возраст подтверждён 12 марта 2025». Для реализации серверу нужно хранить дату подтверждения — такого поля сейчас нет.',
    value: {
      switchWhenLocked: SWITCH_WHEN_LOCKED.OFF,
      heading: HEADING_VARIANT.SHOW,
      preview: GROUP_PREVIEW.ROW_WITH_DATE,
    },
  },
];

type FramingConfig = {
  framing: Framing;
  mode: DescriptionMode;
  render: (props: FramingRenderProps) => ReactNode;
};

const STATIC_NOTE = 'Описания статичные: объясняют, что делает настройка.';
const DYNAMIC_NOTE = 'Описания меняются с тумблерами: говорят, что происходит сейчас.';

const FRAMING_VARIANTS: Variant<FramingConfig>[] = [
  {
    code: 'F1a',
    title: 'По объектам',
    description: `Строки названы по тому, чем управляют, — тайтлы и источники. Тумблеры «показывающие»; источники 18+ включают тайтлы с собой, и строка тайтлов тогда заблокирована включённой — большее включает меньшее. ${STATIC_NOTE}`,
    value: {
      framing: FRAMING.OBJECTS,
      mode: DESCRIPTION_MODE.STATIC,
      render: (props) => <FramingObjects {...props} />,
    },
  },
  {
    code: 'F1b',
    title: 'По объектам',
    description: `То же, что F1a. ${DYNAMIC_NOTE}`,
    value: {
      framing: FRAMING.OBJECTS,
      mode: DESCRIPTION_MODE.DYNAMIC,
      render: (props) => <FramingObjects {...props} />,
    },
  },
  {
    code: 'F2a',
    title: 'Главный + исключение',
    description: `«Показывать 18+» (выключенный скрывает только источники 18+) и исключение из выключенного — «Но показывать …». Полярность у обоих одна; при включённом 18+ исключение стоит включённым, и это правда. ${STATIC_NOTE}`,
    value: {
      framing: FRAMING.EXCEPTION,
      mode: DESCRIPTION_MODE.STATIC,
      render: (props) => <FramingException {...props} />,
    },
  },
  {
    code: 'F2b',
    title: 'Главный + исключение',
    description: `То же, что F2a. ${DYNAMIC_NOTE}`,
    value: {
      framing: FRAMING.EXCEPTION,
      mode: DESCRIPTION_MODE.DYNAMIC,
      render: (props) => <FramingException {...props} />,
    },
  },
  {
    code: 'F3b',
    title: 'Три уровня',
    description:
      'Одна строка: «Скрыто · Частично · Всё» — ровно три состояния, которые дают две настройки. Зависимости нет вовсе, описание всегда про выбранный уровень, поэтому статичного варианта нет.',
    value: {
      framing: FRAMING.LEVELS,
      mode: DESCRIPTION_MODE.DYNAMIC,
      render: (props) => <FramingLevels {...props} />,
    },
  },
  {
    code: 'F4a',
    title: 'Два тумблера, только слова',
    description: `Устройство R3 без изменений. Главный честно говорит, что выключенный скрывает только источники; вложенная — что действует, пока 18+ выключен. ${STATIC_NOTE}`,
    value: {
      framing: FRAMING.TWO_SWITCHES,
      mode: DESCRIPTION_MODE.STATIC,
      render: (props) => <FramingTwoSwitches {...props} />,
    },
  },
  {
    code: 'F4b',
    title: 'Два тумблера, только слова',
    description: `То же, что F4a; у главного — «Сейчас: …». ${DYNAMIC_NOTE}`,
    value: {
      framing: FRAMING.TWO_SWITCHES,
      mode: DESCRIPTION_MODE.DYNAMIC,
      render: (props) => <FramingTwoSwitches {...props} />,
    },
  },
];

const BLUR_VARIANTS: Variant<BlurStyle>[] = [
  {
    code: 'B0',
    title: 'Только размытие',
    description:
      'Как сейчас: blur(20px), поверх — только бейдж 18+ карточки. Не очевидно, почему обложка такая и что будет по клику.',
    value: BLUR_STYLE.PLAIN,
  },
  {
    code: 'B1',
    title: 'Размытие + иконка',
    description:
      'Перечёркнутый глаз по центру — «скрыто», без слов. В списке иконка совсем мелкая.',
    value: BLUR_STYLE.ICON,
  },
  {
    code: 'B2',
    title: 'Размытие + плашка 18+',
    description:
      'Белая плашка «18+» по центру. Называет причину, но дублирует бейдж 18+ в углу карточки.',
    value: BLUR_STYLE.BADGE,
  },
  {
    code: 'B3',
    title: 'Размытие + затемнение + подпись',
    description:
      'Обложка притушена, по центру «18+» и «Скрыто настройками». Самый явный: сразу ясно, что это не ошибка загрузки, а настройка, и где её менять.',
    value: BLUR_STYLE.DIMMED,
  },
];

const LOCK_VARIANTS: Variant<LockScreen>[] = [
  {
    code: 'S0',
    title: 'Как сейчас',
    description:
      'StatusScreen «403 · Контент 18+ скрыт» с кнопками «Назад» и «Настройки». Кнопка ведёт на страницу настроек — там ещё надо найти нужный тумблер.',
    value: LOCK_SCREEN.CURRENT,
  },
  {
    code: 'S1',
    title: 'С обложкой и включением на месте',
    description:
      'Видно, какой тайтл закрыт: размытая обложка и название. «Показать 18+» открывает подтверждение возраста (M1) и сразу включает показ — ходить в настройки не нужно.',
    value: LOCK_SCREEN.WITH_COVER,
  },
];

const renderNested = ({ code, title, description, value }: Variant<NestedConfig>): ReactNode => (
  <DemoSection key={code} code={code} title={title} description={description}>
    <SettingsVariantDemo render={(props) => <SettingsBlockNested {...value} {...props} />} />
  </DemoSection>
);

const renderFlat = ({ code, title, description, value }: Variant<FlatConfig>): ReactNode => (
  <DemoSection key={code} code={code} title={title} description={description}>
    <SettingsVariantDemo render={(props) => <SettingsBlockFlat {...value} {...props} />} />
  </DemoSection>
);

/** Контент 18+: связать две настройки, переписать тексты, показать размытие и закрытую страницу. */
function PlaygroundAdultContent() {
  const [term, setTerm] = useState<Term>(TERM.REGULAR_SOURCES);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Контент 18+</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Тумблеры живые, начальное состояние — умолчания: 18+ выключен, обложки размыты. Десктоп и
        телефон делят одно состояние; темы переключайте в шапке приложения. Всё, что обведено жёлтым
        пунктиром с пометкой «Только песочница», — обвязка макета и в приложение не идёт; остальное
        — как будет в реализации. Обложки сгенерированы: настоящих картинок в макете нет.
      </Text>

      <Title order={3}>Итог</Title>
      <DemoSection
        code="R3 + P3 + F1b + B1 + M1 + S0"
        title="Выбранная комбинация"
        description="Две независимые строки по объектам (F1b, термин N1): «Тайтлы 18+ на обычных источниках» решает только размытие, «Источники 18+» — только сайты 18+. Обе всегда активны (R3 без блокировки), описания говорят о текущем состоянии. Последней строкой — превью обложек (P3); размытые обложки с перечёркнутым глазом (B1) — и в превью, и в каталоге. Всё, что открывает 18+, — через подтверждение возраста (M1); клик по размытому тайтлу ведёт на экран 403 (S0) с текстом в той же терминологии. Настройки, каталог и экран делят одно состояние."
      >
        <FinalDemo />
      </DemoSection>

      <Title order={3}>Блок настроек</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Новая логика: «Показывать 18+» включён — видно всё и без размытия; выключен — источников 18+
        нет, а тайтлы 18+ на обычных источниках размыты и закрыты либо видны как есть, по выбору.
        Включение идёт через подтверждение возраста (M1). Поля те же, что сейчас: showAdultSources и
        hideAdultTitles.
      </Text>
      <DemoSection
        code="R0"
        title="Как сейчас"
        description="Две независимые настройки с противоположной полярностью — «показывать» и «скрывать». Можно включить источники 18+ и при этом размывать тайтлы 18+ на обычных; описания пересказывают заголовки."
      >
        <SettingsVariantDemo render={(props) => <SettingsBlockCurrent {...props} />} />
      </DemoSection>
      {SETTINGS_VARIANTS.map(renderNested)}
      {FLAT_SETTINGS_VARIANTS.map(renderFlat)}
      <DemoSection
        code="R5"
        title="Одна строка с выбором"
        description="Второго тумблера нет: пока 18+ выключен, в той же строке появляется выбор «Размывать / Показывать как есть». Ничего не блокируется, но строка меняет высоту."
      >
        <SettingsVariantDemo render={(props) => <SettingsBlockSegmented {...props} />} />
      </DemoSection>

      <Title order={3}>Тексты</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        T1 — тексты из R1/R2: заголовок говорит, что это, описание — что изменится. Ниже другие
        наборы на устройстве R1.
      </Text>
      {COPY_VARIANTS.map(renderNested)}
      <Text c="dimmed" fz="sm" maw={760}>
        Пары заголовков на устройстве R3 + P3. Описание дополняет заголовок, а не пересказывает его.
      </Text>
      {HEADING_VARIANTS.map(renderFlat)}

      <Title order={3}>Превью</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        P1 — мини-обложка справа от «Размывать обложки», как в R1/R2: размывается вместе с
        тумблером. Ниже — без неё.
      </Text>
      {PREVIEW_VARIANTS.map(renderNested)}
      <Text c="dimmed" fz="sm" maw={760}>
        Превью внутри группы, как на референсе, — на устройстве R3 + H1.
      </Text>
      {GROUP_PREVIEW_VARIANTS.map(renderFlat)}

      <Title order={3}>Тексты, раунд 2</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Одна логика, четыре подачи. Задача текстов — снять четыре путаницы: вложенная настройка
        действует при выключенном главном; «не показывать», а тайтлы видны; источники 18+ и тайтлы
        18+ — разное; «размывать» значит ещё и «не открывается». Подтверждение возраста — на любом
        действии, которое открывает 18+, и его текст называет, что именно откроется. Под каждым
        блоком — заглушка тайтла с текстом этой подачи; кнопка на ней работает.
      </Text>
      <SandboxOnly>
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Как назвать тайтлы 18+ на обычных источниках — меняет все варианты раздела
          </Text>
          <SegmentedControl
            value={term}
            onChange={(value) => setTerm(value as Term)}
            data={Object.values(TERM).map((value) => ({ value, label: getTermLabel(value) }))}
          />
        </Stack>
      </SandboxOnly>
      {FRAMING_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <FramingDemo
            framing={value.framing}
            term={getTermForms(term)}
            mode={value.mode}
            render={value.render}
          />
        </DemoSection>
      ))}

      <Title order={3}>Размытая обложка</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Обычный тайтл и два тайтла 18+ с обычных источников при включённом размытии — в сетке
        каталога и в списке.
      </Text>
      {BLUR_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <BlurStyleDemo blurStyle={value} />
        </DemoSection>
      ))}

      <Title order={3}>Подтверждение возраста</Title>
      <DemoSection
        code="M1"
        title="Модалка при включении"
        description="Появляется при включении «Показывать 18+» — в блоке настроек и на закрытой странице (S1). «Отмена» оставляет тумблер выключенным."
      >
        <AgeConfirmDemo />
      </DemoSection>

      <Title order={3}>Страница скрытого тайтла</Title>
      <Text c="dimmed" fz="sm" maw={760}>
        Куда ведёт клик по размытой карточке. Сейчас сервер пропускает часть таких тайтлов — это
        чиним при переносе в код, здесь только вид заглушки.
      </Text>
      {LOCK_VARIANTS.map(({ code, title, description, value }) => (
        <DemoSection key={code} code={code} title={title} description={description}>
          <DeviceFrames desktopWidth={760} render={() => <LockScreenDemo screen={value} />} />
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundAdultContent;
