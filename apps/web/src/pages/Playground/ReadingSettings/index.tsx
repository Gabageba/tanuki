import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { READER_READING_MODE, type ReaderReadingMode } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import DeviceFrames from './components/DeviceFrames';
import FinalDemo from './components/FinalDemo';
import ReaderDemo from './components/ReaderDemo';
import ReaderGroups from './components/ReaderGroups';
import TabLayout from './components/TabLayout';
import TabsStrip from './components/TabsStrip';
import { DEFAULT_MOCK_MODE, getMockSettings, getMockSettingsWithCustomWidth } from './mocks';
import {
  CHOICE_CONTROL,
  CUSTOM_CONTAINER_WIDTH,
  DISABLED_HINT,
  MOBILE_FRAME_WIDTH,
  NUMBER_CONTROL,
  READER_GROUP,
  SETTINGS_COLUMN_WIDTH,
  TAB_LAYOUT,
  TAB_NAMING,
  TAB_WIDTH,
  type ChoiceControl,
  type DisabledHint,
  type NumberControl,
  type TabLayout as TabLayoutValue,
  type TabNaming,
  type Variant,
} from './models';

const NAMING_VARIANTS: Variant<TabNaming>[] = [
  {
    code: 'N1',
    title: '«Чтение»',
    description:
      'Одно короткое слово накрывает и закладки, и читалку. На телефоне три вкладки остаются в одной строке.',
    value: TAB_NAMING.READING,
  },
  {
    code: 'N2',
    title: '«Библиотека и чтение»',
    description:
      'Обе темы названы прямо, но название вдвое длиннее соседних — на телефоне вкладки переносятся на вторую строку.',
    value: TAB_NAMING.LIBRARY_AND_READING,
  },
  {
    code: 'N3',
    title: '«Читалка»',
    description:
      'Точно про настройки читалки, но категории закладок под таким названием искать не станут.',
    value: TAB_NAMING.READER,
  },
  {
    code: 'N4',
    title: 'Две вкладки: «Библиотека» и «Читалка»',
    description:
      'У каждой темы своя вкладка, но «Библиотека» пока будет из одной заглушки, а на телефоне четыре вкладки в строку не влезают.',
    value: TAB_NAMING.TWO_TABS,
  },
];

const LAYOUT_VARIANTS: Variant<TabLayoutValue>[] = [
  {
    code: 'L1',
    title: 'Два блока: закладки и читалка',
    description:
      'Все настройки читалки — одним блоком «Читалка» на восемь строк, рядом с закладками. Самая простая структура, но колонка читалки вдвое выше колонки закладок.',
    value: TAB_LAYOUT.ONE_BLOCK,
  },
  {
    code: 'L2',
    title: 'Читалка тремя блоками в сетке',
    description:
      '«Отображение», «Отступы и зона клика», «Поведение» — отдельными блоками, в две колонки, как на «Общих». Колонки выходят ровнее, у каждого блока своя подпись.',
    value: TAB_LAYOUT.SPLIT_BLOCKS,
  },
  {
    code: 'L3',
    title: 'Одна колонка',
    description:
      'Те же блоки, что в L2, но одной колонкой на ширину блока «Общих»: закладки сверху, читалка под ними. На десктопе ничего не перескакивает между колонками, но справа остаётся пустое место.',
    value: TAB_LAYOUT.ONE_COLUMN,
  },
];

const CHOICE_VARIANTS: Variant<ChoiceControl>[] = [
  {
    code: 'C0',
    title: 'Как в drawer',
    description:
      'Карточки с описанием под заголовком строки — то же, что сейчас в читалке. Каждое значение объяснено, но крупные карточки выбиваются из строк остальных блоков настроек.',
    value: CHOICE_CONTROL.CARDS,
  },
  {
    code: 'C1',
    title: 'Сегменты справа',
    description:
      'Оба значения видны сразу, а описание строки говорит, что делает выбранное. На телефоне сегменты уходят под заголовок на всю ширину.',
    value: CHOICE_CONTROL.SEGMENTED,
  },
  {
    code: 'C2',
    title: 'Select справа',
    description:
      'Как «Язык интерфейса» на «Общих». Самая компактная строка, но второе значение видно только после клика — для выбора из двух это лишний шаг.',
    value: CHOICE_CONTROL.SELECT,
  },
  {
    code: 'C3',
    title: 'Радио-строки, как выбор темы',
    description:
      'Каждое значение — своя строка с иконкой и пояснением под заголовком настройки, как в T3. Всё объяснено без клика, но блок вдвое выше.',
    value: CHOICE_CONTROL.RADIO_ROWS,
  },
];

const NUMBER_VARIANTS: Variant<NumberControl>[] = [
  {
    code: 'S0',
    title: 'Как в drawer',
    description:
      'Ползунок, число и три пресета-плитки внутри строки. Всё под рукой, но каждая настройка — три яруса управления, блок выходит длинным.',
    value: NUMBER_CONTROL.DRAWER,
  },
  {
    code: 'S1',
    title: 'Ползунок под строкой',
    description:
      'Число справа в строке, ползунок под заголовком, без пресетов: точное значение и так видно числом.',
    value: NUMBER_CONTROL.SLIDER,
  },
  {
    code: 'S2',
    title: 'Только пресеты',
    description: `Сегменты «Узко / Средне / Широко» справа, точная подстройка остаётся в читалке. Если там выставлено своё значение (ширина ${CUSTOM_CONTAINER_WIDTH} px), ни один сегмент не выбран, а описание говорит «Своё значение».`,
    value: NUMBER_CONTROL.PRESETS,
  },
  {
    code: 'S3',
    title: 'Поле ввода и пресеты',
    description:
      'Точное число вводится полем справа, пресеты — чипами под строкой. Удобно на десктопе; на телефоне ввод числа — лишний шаг, ползунок там быстрее.',
    value: NUMBER_CONTROL.INPUT,
  },
];

const HINT_VARIANTS: Variant<DisabledHint>[] = [
  {
    code: 'D1',
    title: 'Пояснение в описании',
    description:
      'Погашенная строка вместо описания говорит, когда она действует: «Только в горизонтальном режиме». Видно сразу и на телефоне.',
    value: DISABLED_HINT.DESCRIPTION,
  },
  {
    code: 'D2',
    title: 'Подгруппы по режиму',
    description:
      'Отступы — в блоке «Вертикальный режим», зона клика — в «Горизонтальный режим». Блок неактивного режима гаснет целиком, в его шапке — «Сейчас не действует». Ширина контейнера зависит от масштаба, а не от режима, поэтому её пояснение остаётся в описании.',
    value: DISABLED_HINT.SUBGROUPS,
  },
  {
    code: 'D3',
    title: 'Подсказка при наведении',
    description:
      'Описание остаётся обычным, строка просто гаснет, причина — в тултипе. На телефоне наведения нет, и причину там не узнать.',
    value: DISABLED_HINT.TOOLTIP,
  },
];

function PlaygroundReadingSettings() {
  const [mode, setMode] = useState<ReaderReadingMode>(DEFAULT_MOCK_MODE);

  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Вкладка «Чтение» в настройках</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Новая вкладка настроек: категории закладок и настройки читалки — те же, что в drawer
        читалки, но строками GroupedList. Категории закладок пока не делаем: серые строки — только
        место под блок. Оси сравниваются по отдельности: N — название вкладки, L — раскладка, C —
        выбор режима и масштаба, S — числовые настройки, D — как показаны настройки, которые в
        текущем режиме не действуют. Где ось не своя, взяты C1, S1 и D1. Каждый вариант — на
        десктопе и в рамке телефона {MOBILE_FRAME_WIDTH}px, правка в одной рамке видна в другой. Всё
        без пометки «Только песочница» показано так, как пойдёт в реализацию. Проверьте обе темы.
      </Text>

      <Stack gap="lg">
        <Title order={3}>Итог</Title>
        <DemoSection
          code="N4 + L2 + C2 + S0 + D1"
          title="Вкладка «Читалка»"
          description="Закладки и читалка — на разных вкладках (N4); «Библиотеки» пока нет, она появится вместе с категориями закладок, а пока вкладок три. На «Читалке» три блока в сетке из двух колонок (L2), режим и масштаб выбираются Select'ом (C2), числа — ползунком с пресетами, как в drawer (S0), но с описанием, как у остальных строк настроек. Неактивная строка гаснет, а описание говорит, когда она действует (D1). Полоса вкладок не переносится, а прокручивается вбок."
        >
          <FinalDemo />
        </DemoSection>
      </Stack>

      <Stack gap="lg">
        <Title order={3}>N — название вкладки</Title>
        {NAMING_VARIANTS.map(({ code, title, description, value }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <DeviceFrames
              desktopWidth={SETTINGS_COLUMN_WIDTH}
              render={() => <TabsStrip naming={value} />}
            />
          </DemoSection>
        ))}
      </Stack>

      <Stack gap="lg">
        <Title order={3}>L — раскладка вкладки</Title>
        {LAYOUT_VARIANTS.map(({ code, title, description, value }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <ReaderDemo
              initialSettings={getMockSettings(DEFAULT_MOCK_MODE)}
              desktopWidth={TAB_WIDTH}
              render={(props) => <TabLayout {...props} layout={value} />}
            />
          </DemoSection>
        ))}
      </Stack>

      <SandboxOnly>
        <Group gap="sm">
          <Text fz="sm">Режим чтения во всех вариантах C, S и D:</Text>
          <SegmentedControl
            size="xs"
            value={mode}
            onChange={(value) => setMode(value as ReaderReadingMode)}
            data={[
              { value: READER_READING_MODE.VERTICAL, label: 'Вертикальный' },
              { value: READER_READING_MODE.HORIZONTAL, label: 'Горизонтальный' },
            ]}
          />
        </Group>
      </SandboxOnly>

      <Stack gap="lg">
        <Title order={3}>C — выбор режима и масштаба</Title>
        {CHOICE_VARIANTS.map(({ code, title, description, value }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <ReaderDemo
              key={mode}
              initialSettings={getMockSettings(mode)}
              desktopWidth={SETTINGS_COLUMN_WIDTH}
              render={(props) => (
                <ReaderGroups
                  {...props}
                  config={{
                    choice: value,
                    number: NUMBER_CONTROL.SLIDER,
                    hint: DISABLED_HINT.DESCRIPTION,
                  }}
                  only={[READER_GROUP.DISPLAY]}
                />
              )}
            />
          </DemoSection>
        ))}
      </Stack>

      <Stack gap="lg">
        <Title order={3}>S — числовые настройки</Title>
        {NUMBER_VARIANTS.map(({ code, title, description, value }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <ReaderDemo
              key={mode}
              initialSettings={getMockSettingsWithCustomWidth(mode)}
              desktopWidth={SETTINGS_COLUMN_WIDTH}
              render={(props) => (
                <Stack gap="lg">
                  <ReaderGroups
                    {...props}
                    config={{
                      choice: CHOICE_CONTROL.SEGMENTED,
                      number: value,
                      hint: DISABLED_HINT.DESCRIPTION,
                    }}
                    only={[READER_GROUP.DISPLAY, READER_GROUP.SPACING]}
                  />
                </Stack>
              )}
            />
          </DemoSection>
        ))}
      </Stack>

      <Stack gap="lg">
        <Title order={3}>D — неактивные настройки</Title>
        {HINT_VARIANTS.map(({ code, title, description, value }) => (
          <DemoSection key={code} code={code} title={title} description={description}>
            <ReaderDemo
              key={mode}
              initialSettings={getMockSettings(mode)}
              desktopWidth={SETTINGS_COLUMN_WIDTH}
              render={(props) => (
                <Stack gap="lg">
                  <ReaderGroups
                    {...props}
                    config={{
                      choice: CHOICE_CONTROL.SEGMENTED,
                      number: NUMBER_CONTROL.SLIDER,
                      hint: value,
                    }}
                  />
                </Stack>
              )}
            />
          </DemoSection>
        ))}
      </Stack>
    </Stack>
  );
}

export default PlaygroundReadingSettings;
