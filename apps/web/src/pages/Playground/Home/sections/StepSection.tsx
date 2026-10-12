import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeSections from '../components/HomeSections';
import { HOME_DESU, HOME_REMANGA } from '../mocks';
import { SECTION_STEP, type SectionStep } from '../models';

/** Реманга — с тремя блоками из шести, чтобы варианты сравнивались на одном экране. */
const HOMES = [{ ...HOME_REMANGA, blocks: HOME_REMANGA.blocks.slice(0, 3) }, HOME_DESU];

const VARIANTS: {
  code: string;
  step: SectionStep;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'S1',
    step: SECTION_STEP.PLAIN,
    title: 'Как в поиске, блок — мелким заголовком',
    description:
      'Секция поиска как есть: SourceTitle с «Каталог →», Divider между источниками. Название блока — 14 полужирный над лентой, ступенью ниже заголовка источника h5.',
    pros: [
      'повторяет решённый поиск (S1 + R2) — одна схема в двух местах',
      'все блоки источника видны сразу, без кликов',
      'два уровня читаются: логотип и h5 против строки 14',
    ],
    cons: [
      'у Реманги шесть блоков — секция в шесть лент, источник уезжает за экран',
      'граница источника — только линия между секциями',
    ],
  },
  {
    code: 'S2',
    step: SECTION_STEP.TABS,
    title: 'Блоки — чипами, лента одна',
    description:
      'Под заголовком источника — чипы его блоков, под ними одна лента выбранного. Источник занимает одну ленту, сколько бы блоков у него ни было.',
    pros: [
      'секция любого источника — одна лента, страница короче в разы',
      'названия всех блоков видны сразу, строкой',
    ],
    cons: [
      'остальные блоки не видны без клика — «посмотреть, что нового» дольше',
      'на телефоне чипы не влезают и листаются отдельно от ленты',
      'выбор чипа не запоминается — при каждом заходе первый блок',
    ],
  },
  {
    code: 'S3',
    step: SECTION_STEP.COLOR_LINE,
    title: 'Блоки отбиты линией цвета источника',
    description:
      'Как S1, но блоки источника слева отчёркнуты вертикальной линией его цвета (SOURCE_CATALOG.color). Видно, где источник кончается, даже когда заголовок уехал вверх.',
    pros: [
      'принадлежность блока источнику видна на любой прокрутке',
      'цвет источника уже знаком по ленте на обложках',
    ],
    cons: [
      'цветная линия у каждой секции — пёстрая страница',
      'лента сдвигается вправо — на телефоне минус 20 px ширины',
      'у похожих по цвету источников линии не различить',
    ],
  },
  {
    code: 'S4',
    step: SECTION_STEP.PAPER,
    title: 'Источник на подложке',
    description:
      'Вся секция источника — в рамке. Линия между секциями не нужна: каждая отделена своей рамкой.',
    pros: ['чёткая граница источника', 'секции легко пересчитать глазами'],
    cons: [
      'в поиске рамку уже отвергли (S4): ленты со стрелками в рамке выглядят тесно',
      'на телефоне рамка съедает ширину ленты',
    ],
  },
];

/** Ось S — как отделены источник и блоки внутри него. */
function StepSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Источник и блоки"
        description="Две ступени: источник и блоки с его главной. Реманга — три блока из шести, Desu — два. Ссылка в каталог везде «Каталог →» справа (L1), короткие блоки — той же лентой (K1)."
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

export default StepSection;
