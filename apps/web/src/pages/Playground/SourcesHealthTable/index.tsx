import { useState } from 'react';
import { Group, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SandboxOnly from '../components/SandboxOnly';
import AxisHeader from '../UsersAdmin/components/AxisHeader';
import DrawerPreview from './components/DrawerPreview';
import HealthDemo from './components/HealthDemo';
import { DRAWER_SAMPLE_IDS, MOCK_SOURCES } from './mocks';
import {
  DEMO_STATE,
  DRAWER_LAYOUT,
  TABLE_LAYOUT,
  VIEWER,
  type DemoState,
  type DrawerLayout,
  type DrawerVariant,
  type Variant,
  type Viewer,
} from './models';

const TABLE_VARIANTS: Variant[] = [
  {
    code: 'T0',
    title: 'Как сейчас',
    description:
      'Семь столбцов: источник, статус с датой, причина, давность проверки, ночей подряд, две строки ошибки и кнопка проверки в каждой строке. Порядок жёсткий — лежащие сверху, фильтров нет.',
    pros: ['Всё видно сразу, без кликов', 'Проверка одного источника — в один клик'],
    cons: [
      'Шире ноутбука (860px): статус, его дата, причина и ошибка разнесены по четырём столбцам',
      '«Ночей подряд» — столбец нулей у всех рабочих источников',
      'Кнопки проверки видны всем, хотя гонять проверку незачем каждому',
      'Не похоже на таблицы «Управления»: ни фильтров, ни сортировки, ни карточки',
    ],
    layout: TABLE_LAYOUT.CURRENT,
  },
  {
    code: 'T1',
    title: 'Четыре столбца: Источник · Статус · Проверка · Ошибка',
    description:
      'Ячейки собраны как у пользователей. «Источник» — иконка, название и домен. «Статус» — бейдж, «С 01.10.2026» и причина. «Проверка» — давность и, если падает, «3 ночи подряд». «Ошибка» — две строки серым, целиком — в карточке.',
    pros: [
      'Текст ошибки виден без клика — удобно сравнивать соседние поломки',
      'Помещается в ноутбук; три из четырёх столбцов сортируются',
    ],
    cons: [
      'У рабочих источников столбец ошибки пустой — четверть ширины уходит на прочерки',
      'Первые две строки ошибки часто ничего не говорят («SourceBlockedError: anti-bot…»)',
    ],
    layout: TABLE_LAYOUT.ERROR_COLUMN,
  },
  {
    code: 'T2',
    title: 'Три столбца, ошибка под причиной',
    description:
      'Как T1 без столбца «Ошибка»: её первая строка — третьей строкой в ячейке статуса, моноширинно и обрезанной. Пустых ячеек нет.',
    pros: [
      'Самая узкая таблица с ошибкой в строке, пустого столбца нет',
      'Ошибка стоит рядом со статусом и причиной, которые она объясняет',
    ],
    cons: [
      'Строки сломанных источников выше рабочих — таблица неровная',
      'Одна обрезанная строка ошибки говорит ещё меньше, чем две в T1',
    ],
    layout: TABLE_LAYOUT.ERROR_UNDER_STATUS,
  },
  {
    code: 'T3',
    title: 'Три столбца, ошибка только в карточке',
    description:
      'В таблице — бейдж, дата и причина; что именно сломалось, видно в карточке по клику. По высоте строк и плотности — как таблица пользователей.',
    pros: [
      'Самая спокойная таблица, строки одной высоты',
      'Причина («Упала ночная проверка») уже говорит, куда смотреть, — сырая ошибка нужна при разборе',
    ],
    cons: ['Чтобы прочитать ошибку, нужен клик', 'Ошибки двух источников рядом не сравнить'],
    layout: TABLE_LAYOUT.ERROR_IN_DRAWER,
  },
  {
    code: 'T4',
    title: 'Как status-page: полоска последних 30 ночей',
    description:
      'T3 плюс столбец «30 ночей»: столбик на ночь — зелёный прошла, красный упала, серый — нет данных; у столбика тултип с датой. Под полоской — «Падений: 3 из 30». Ошибка — в карточке.',
    pros: [
      'Видно, давно ли источник лежит и как часто мигает, — чего не скажет «3 ночи подряд»',
      'Привычная по status-page картинка, считывается без чтения',
    ],
    cons: [
      'В API истории нет — только серия упавших ночей: нужна таблица результатов проверок',
      'Ночь говорит только про ночную проверку; «Нестабилен» от живого трафика на полоске не виден',
      'Полоска забирает ширину, которой хватило бы на ошибку',
    ],
    layout: TABLE_LAYOUT.NIGHTS_STRIP,
  },
  {
    code: 'T5',
    title: 'Четыре столбца, причина рядом с ошибкой',
    description:
      'T1, но причина переехала из ячейки статуса в четвёртый столбец, который теперь называется «Причина»: сверху причина обычным цветом, под ней две строки ошибки серым. В «Статусе» остаются бейдж и «С 01.10.2026». Ошибки нет — одна причина; нет ни того, ни другого — прочерк.',
    pros: [
      '«Что случилось» и «как именно» читаются вместе, сверху вниз',
      'Столбец не пустует у рабочих источников, у которых есть причина («Источник снова отвечает»)',
      'Ячейка статуса ниже — бейдж и дата',
    ],
    cons: [
      'Строки сломанных источников выше, чем в T1: причина и ещё две строки',
      'Сортировки по причине нет — меню «Статуса» больше не про то, что видно в соседнем столбце',
    ],
    layout: TABLE_LAYOUT.REASON_COLUMN,
  },
];

const DRAWER_VARIANTS: DrawerVariant[] = [
  {
    code: 'D1',
    title: 'Поля, ошибка под ними',
    description:
      'Как карточка пользователя: иконка, название и домен, поля «подпись — значение» (статус, причина, контент, проверен, упало ночей подряд), ниже — полная ошибка блоком с копированием. Внизу — «Проверить сейчас» (только персоналу) и «Открыть каталог».',
    pros: [
      'Одна раскладка у всех карточек «Управления» и здоровья',
      'Порядок не зависит от статуса',
    ],
    cons: ['Ошибка — главное при поломке — внизу, у длинной ошибки кнопки уезжают под прокрутку'],
    layout: DRAWER_LAYOUT.FIELDS,
  },
  {
    code: 'D2',
    title: 'Ошибка сразу под шапкой',
    description:
      'Те же поля, но блок ошибки — сразу под названием, до полей. У рабочего источника блока нет, и карточка такая же, как D1.',
    pros: [
      'Открыл сломанный источник — сразу видишь, что сломалось',
      'Поля и кнопки не уезжают вниз из-за длинной ошибки — блок ограничен по высоте и прокручивается',
    ],
    cons: [
      'Раскладка зависит от статуса и отличается от карточки пользователя',
      'Ошибка оторвана от статуса и причины, которые её объясняют',
    ],
    layout: DRAWER_LAYOUT.ERROR_FIRST,
  },
  {
    code: 'D3',
    title: 'Причина заголовком к ошибке, внизу',
    description:
      'D1 без поля «Причина»: она стоит заголовком над блоком ошибки под полями — «Упала ночная проверка», под ней полный текст. Ошибки нет — причина одна на том же месте; нет причины — блока нет.',
    pros: [
      'Причина объясняет ошибку прямо над ней, подпись «Ошибка» не нужна',
      'Полей на одно меньше, порядок не зависит от статуса',
    ],
    cons: [
      'Причина — главное о поломке — опущена ниже всех полей',
      'У рабочего источника с причиной («Источник снова отвечает») она висит внизу одна',
    ],
    layout: DRAWER_LAYOUT.REASON_WITH_ERROR,
  },
  {
    code: 'D4',
    title: 'Причина и ошибка сразу под шапкой',
    description:
      'D2, но над блоком ошибки — причина заголовком, а поля «Причина» нет. Открыл источник — первым видишь, что случилось и как именно; дальше статус, контент и проверка.',
    pros: [
      'Самое важное о поломке — в начале карточки, одним блоком',
      'Работает и без ошибки: «Источник снова отвечает» одной строкой под шапкой',
    ],
    cons: [
      'Раскладка не похожа на карточку пользователя',
      'Причина стоит раньше статуса, который она объясняет',
    ],
    layout: DRAWER_LAYOUT.REASON_WITH_ERROR_FIRST,
  },
  {
    code: 'D5',
    title: 'D1 с источником в заголовке',
    description:
      'Вместо «Источник» в заголовке карточки — иконка, название и домен второй строкой; крупного блока с иконкой в теле нет, карточка начинается сразу с полей. Дальше как в D1: поля, ошибка блоком, кнопки.',
    pros: [
      'Заголовок не повторяется блоком ниже — карточка короче на целый блок',
      'Рядом с крестиком сразу видно, какой источник открыт',
    ],
    cons: [
      'Карточки пользователя и приглашения устроены по-старому — при выборе их стоит перевести так же',
      'Длинное название обрезается: в заголовке рядом крестик',
    ],
    layout: DRAWER_LAYOUT.FIELDS_TITLED,
  },
];

const FINAL_TABLE: Variant = {
  code: 'T5 + D3',
  title: 'Итог',
  description:
    'Таблица T5: Источник · Статус · Проверка · Причина. В «Статусе» — бейдж и «С 01.10.2026», в «Причине» — причина и под ней две строки ошибки. Фильтры «Статус» и «Контент», сортировка по заголовкам, по умолчанию лежащие сверху; «Проверить все» — только у персонала. Клик по строке открывает карточку D3: заголовок «Источник», иконка, название и домен, поля (статус, контент, проверен, упало ночей подряд), под ними причина заголовком к полному тексту ошибки и кнопки «Проверить сейчас» (персоналу) и «Открыть каталог».',
  pros: [
    'Причина и ошибка — одной связкой и в таблице, и в карточке',
    'Таблица в одну ширину ноутбука и в обвязке «Управления»: фильтры, сортировка, карточка',
    'Карточка устроена как карточка пользователя — те же заголовок, шапка и поля',
  ],
  cons: ['Строки сломанных источников выше рабочих', 'Причина в карточке — ниже всех полей'],
  layout: TABLE_LAYOUT.REASON_COLUMN,
};

const DRAWER_SAMPLES = DRAWER_SAMPLE_IDS.flatMap(
  (id) => MOCK_SOURCES.find((source) => source.id === id) ?? [],
);

function PlaygroundSourcesHealthTable() {
  const [viewer, setViewer] = useState<Viewer>(VIEWER.STAFF);
  const [demoState, setDemoState] = useState<DemoState>(DEMO_STATE.DATA);
  const [drawerLayout, setDrawerLayout] = useState<DrawerLayout>(DRAWER_LAYOUT.FIELDS);

  return (
    <Stack gap="xl" p="md">
      <Group gap="sm" wrap="nowrap">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Таблица здоровья источников</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Переделка /sources/health по образцу таблиц «Управления»: составные ячейки, фильтры,
        сортировка по заголовкам и карточка по клику вместо кнопок в строках. Страница остаётся
        отдельной и видна всем, а проверять источники может только персонал. Переключатели ниже
        меняют сразу все варианты: кто смотрит, состояние таблицы и какая карточка откроется по
        клику на строку. Всё без пометки «Только песочница» показано так, как пойдёт в реализацию.
        На телефоне таблица листается вбок, как в «Управлении».
      </Text>

      <SandboxOnly>
        <Stack gap="xs">
          <Group gap="sm">
            <Text fz="sm" w={120}>
              Смотрит
            </Text>
            <SegmentedControl
              size="xs"
              value={viewer}
              onChange={(value) => setViewer(value as Viewer)}
              data={[
                { value: VIEWER.STAFF, label: 'Персонал' },
                { value: VIEWER.USER, label: 'Пользователь' },
              ]}
            />
          </Group>
          <Group gap="sm">
            <Text fz="sm" w={120}>
              Состояние
            </Text>
            <SegmentedControl
              size="xs"
              value={demoState}
              onChange={(value) => setDemoState(value as DemoState)}
              data={[
                { value: DEMO_STATE.DATA, label: 'Данные' },
                { value: DEMO_STATE.LOADING, label: 'Загрузка' },
                { value: DEMO_STATE.EMPTY, label: 'Ничего не найдено' },
              ]}
            />
          </Group>
          <Group gap="sm">
            <Text fz="sm" w={120}>
              Карточка
            </Text>
            <SegmentedControl
              size="xs"
              value={drawerLayout}
              onChange={(value) => setDrawerLayout(value as DrawerLayout)}
              data={DRAWER_VARIANTS.map((variant) => ({
                value: variant.layout,
                label: variant.code,
              }))}
            />
          </Group>
        </Stack>
      </SandboxOnly>

      <DemoSection
        code={FINAL_TABLE.code}
        title={FINAL_TABLE.title}
        description={FINAL_TABLE.description}
        pros={FINAL_TABLE.pros}
        cons={FINAL_TABLE.cons}
      >
        <HealthDemo
          layout={FINAL_TABLE.layout}
          drawerLayout={DRAWER_LAYOUT.REASON_WITH_ERROR}
          viewer={viewer}
          demoState={demoState}
        />
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
          {DRAWER_SAMPLES.map((source) => (
            <DrawerPreview
              key={source.id}
              source={source}
              layout={DRAWER_LAYOUT.REASON_WITH_ERROR}
              viewer={viewer}
            />
          ))}
        </SimpleGrid>
      </DemoSection>

      <AxisHeader
        title="T — столбцы"
        description="Общее для T1–T5: над таблицей фильтры «Статус» и «Контент», поиска и страниц нет — источников два десятка. «Источник» сортируется по названию, «Статус» — по статусу или дате смены, «Проверка» — по времени или упавшим ночам; по умолчанию лежащие сверху. Кнопок в строках нет — клик открывает карточку, ссылка на каталог тоже переехала туда. «Проверить все» — только у персонала."
      />
      {TABLE_VARIANTS.map((variant) => (
        <DemoSection
          key={variant.code}
          code={variant.code}
          title={variant.title}
          description={variant.description}
          pros={variant.pros}
          cons={variant.cons}
        >
          <HealthDemo
            layout={variant.layout}
            drawerLayout={drawerLayout}
            viewer={viewer}
            demoState={demoState}
          />
        </DemoSection>
      ))}

      <AxisHeader
        title="D — карточка источника"
        description="Открывается кликом по строке справа, на телефоне — снизу. Здесь — рядом, без кликов: лежащий источник с длинной ошибкой, рабочий и ни разу не проверявшийся. Переключатель «Смотрит» убирает «Проверить сейчас» у пользователя."
      />
      {DRAWER_VARIANTS.map((variant) => (
        <DemoSection
          key={variant.code}
          code={variant.code}
          title={variant.title}
          description={variant.description}
          pros={variant.pros}
          cons={variant.cons}
        >
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
            {DRAWER_SAMPLES.map((source) => (
              <DrawerPreview
                key={source.id}
                source={source}
                layout={variant.layout}
                viewer={viewer}
              />
            ))}
          </SimpleGrid>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlaygroundSourcesHealthTable;
