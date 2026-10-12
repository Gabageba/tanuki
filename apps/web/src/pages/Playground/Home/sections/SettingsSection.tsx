import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeSettingsHint from '../components/HomeSettingsHint';
import SettingsCheckboxes from '../components/SettingsCheckboxes';
import SettingsCollapsible from '../components/SettingsCollapsible';
import SettingsExpanded from '../components/SettingsExpanded';
import SettingsMultiselect from '../components/SettingsMultiselect';
import { MOCK_HOME_SETTINGS } from '../mocks';
import { SETTINGS_BLOCKS } from '../models';

const VARIANTS: {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  content: ReactNode;
}[] = [
  {
    code: 'T1',
    title: 'Блоки раскрыты сразу',
    description:
      'У источника переключатель «Показывать на главной», под ним галочки его блоков с переносом. Выключен источник — галочки гаснут, но выбор в них не теряется.',
    pros: [
      'весь выбор виден без кликов',
      'один клик на блок',
      'тот же GroupedList, что во вкладке «Источники»',
    ],
    cons: [
      'вкладка длинная: 15+ источников по 2–7 блоков',
      'два уровня управления — переключатель и галочки',
    ],
    content: <SettingsExpanded homes={MOCK_HOME_SETTINGS} />,
  },
  {
    code: 'T1a',
    title: 'T1, галочки в одну колонку',
    description:
      'Как T1, но галочки блоков столбиком под строкой источника — по одной на строку, ровно под названием.',
    pros: [
      'ровный край — список легко пробежать глазами',
      'длинные названия («Сейчас читают: Набирающее популярность») не ломают ряд',
    ],
    cons: ['самая длинная вкладка: Реманга одна занимает шесть строк'],
    content: <SettingsExpanded homes={MOCK_HOME_SETTINGS} blocksLayout={SETTINGS_BLOCKS.COLUMN} />,
  },
  {
    code: 'T1b',
    title: 'T1, галочки сеткой 2/3',
    description:
      'Как T1, но галочки — ровной сеткой: две колонки на телефоне, три на десктопе. Галочки встают друг под другом.',
    pros: ['вдвое-втрое короче колонки, но край ровный', 'на телефоне две колонки ещё читаются'],
    cons: [
      'длинное название блока переносится внутри узкой колонки',
      'у источника с двумя блоками третья колонка пустая',
    ],
    content: <SettingsExpanded homes={MOCK_HOME_SETTINGS} blocksLayout={SETTINGS_BLOCKS.GRID} />,
  },
  {
    code: 'T2',
    title: 'Блоки по раскрытию',
    description:
      'Под названием «4 из 6 подборок» с кареткой — нажатие раскрывает галочки столбиком. Переключатель источника справа, как в T1.',
    pros: ['список короткий — источник в одну строку', 'сколько включено — видно и в свёрнутом'],
    cons: [
      'чтобы увидеть, какие именно блоки выключены, — раскрыть',
      'каретка под названием — маленькая цель на телефоне',
    ],
    content: <SettingsCollapsible homes={MOCK_HOME_SETTINGS} />,
  },
  {
    code: 'T3',
    title: 'Блоки в мультиселекте',
    description:
      'Одна строка: логотип, название, CompactMultiSelect с блоками («Горячие новинки +3») и переключатель. На телефоне поле уходит под строку.',
    pros: ['самая плотная вкладка на десктопе', 'тот же CompactMultiSelect, что в фильтрах'],
    cons: [
      'состав видно только в дропдауне — «+3» не говорит, каких нет',
      'на телефоне строка всё равно в два этажа',
      'поле с пустым выбором и выключенный источник — два способа сказать «ничего»',
    ],
    content: <SettingsMultiselect homes={MOCK_HOME_SETTINGS} />,
  },
  {
    code: 'T4',
    title: 'Только галочки',
    description:
      'Без переключателя: источник на главной, пока отмечен хоть один его блок. Справа галочка «все» — полупустая, когда отмечена часть.',
    pros: [
      'один уровень управления вместо двух',
      'нет состояния «источник выключен, а блоки отмечены»',
    ],
    cons: [
      'расходится с планом: там отдельный «Показывать на главной» и отдельное хранение выключенных источников',
      'чтобы убрать источник и потом вернуть, теряется выбор блоков',
    ],
    content: <SettingsCheckboxes homes={MOCK_HOME_SETTINGS} />,
  },
];

/** Ось T — вкладка «Главная» в настройках. */
function SettingsSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Вкладка «Главная» в настройках"
        description="Пять источников в общем порядке. Сначала Desu выключен, у Реманги снято «Популярное», у MangaLib — «Набирающее популярность». Переключатели и галочки живые; у десктопа и телефона состояние своё."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, content }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <Stack gap="lg" maw={640}>
              <HomeSettingsHint />
              {content}
            </Stack>
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default SettingsSection;
