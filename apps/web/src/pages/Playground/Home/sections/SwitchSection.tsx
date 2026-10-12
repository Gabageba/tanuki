import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeSections from '../components/HomeSections';
import { HOME_MANGALIB, HOME_REMANGA } from '../mocks';
import { SECTION_STEP, type SectionStep } from '../models';

const HOMES = [HOME_REMANGA, HOME_MANGALIB];

const VARIANTS: {
  code: string;
  step: SectionStep;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'S2',
    step: SECTION_STEP.TABS,
    title: 'Чипы (выбранное)',
    description: 'Для сравнения: чипы outline под заголовком источника, под ними одна лента.',
    pros: [
      'выбранный блок виден, остальные — названиями рядом',
      'чипы — привычный выбор одного из',
    ],
    cons: ['на телефоне вторая горизонтальная прокрутка над лентой'],
  },
  {
    code: 'S2a',
    step: SECTION_STEP.TABS_SEGMENTED,
    title: 'Сегменты',
    description:
      'SegmentedControl: блоки — сегментами одной плашки, выбранный выделен подложкой, которая переезжает при выборе.',
    pros: ['выбранное заметнее всего', 'читается как «одно из», а не как набор фильтров'],
    cons: [
      'шесть сегментов не влезают ни в одну ширину — плашка листается',
      'тяжелее чипов: серая плашка на всю строку у каждого источника',
    ],
  },
  {
    code: 'S2b',
    step: SECTION_STEP.TABS_TEXT,
    title: 'Текстовые вкладки, как на сайтах',
    description:
      'Названия блоков строкой текста, активное — обычным цветом с акцентной линией снизу, остальные приглушены. Так блоки переключают сами Реманга и MangaLib.',
    pros: [
      'легче чипов и сегментов — строка текста, не кнопки',
      'знакомо тем, кто читает на самих сайтах',
    ],
    cons: [
      'подчёркивание то же, что у навигации H4 в шапке, — два одинаковых приёма на экране',
      'на телефоне листается, как чипы',
    ],
  },
  {
    code: 'S2c',
    step: SECTION_STEP.TABS_SELECT,
    title: 'Дропдаун в строке заголовка',
    description:
      'Блок выбирается Select в строке источника, между названием и «Каталог →». Отдельной строки переключателя нет; на телефоне поле уходит под название.',
    pros: ['самая короткая секция на десктопе', 'длинные названия блоков не режутся строкой'],
    cons: [
      'какие ещё блоки есть — видно только после клика',
      'на телефоне выигрыша нет: поле всё равно отдельной строкой',
    ],
  },
  {
    code: 'S2d',
    step: SECTION_STEP.TABS_ARROWS,
    title: 'Стрелки ‹ › у названия',
    description:
      'Над лентой — название открытого блока между стрелками и «2/6»: листают блоки по кругу. Строка такая же, как заголовок блока в S1.',
    pros: ['одна строка на любой ширине, ничего не листается вбок', 'выглядит почти как S1'],
    cons: [
      'к пятому блоку — четыре клика, названий остальных не видно',
      'стрелки над лентой спорят со стрелками самой ленты',
    ],
  },
  {
    code: 'S2e',
    step: SECTION_STEP.TABS_COUNT,
    title: 'Чипы со счётчиком',
    description:
      'Как S2, но у выбранного чипа — сколько в блоке тайтлов: у «Сейчас читают» MangaLib видно, что их всего три.',
    pros: ['короткая лента не выглядит недогруженной — счётчик объясняет'],
    cons: [
      'счётчик в поиске отвергли (S2): число ради числа',
      'чип меняет ширину при выборе — строка чуть прыгает',
    ],
  },
];

/** Ось S2 — чем переключать блоки источника, если на экране одна лента. */
function SwitchSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S2"
        title="Переключение блоков"
        description="Варианты к выбранному S2: у источника одна лента, блоки переключаются. Реманга — все шесть блоков, MangaLib — с короткими «Сейчас читают». Выбор не запоминается: при заходе открыт первый блок."
      />
      {VARIANTS.map(({ code, step, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <HomeSections homes={HOMES} step={step} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default SwitchSection;
