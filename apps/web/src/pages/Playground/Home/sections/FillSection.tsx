import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeFilledPage from '../components/HomeFilledPage';
import { HOME_FILL, type HomeFill } from '../models';

const VARIANTS: {
  code: string;
  fill: HomeFill;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'W1',
    fill: HOME_FILL.RIBBONS,
    title: 'Всё лентами обложек',
    description:
      '«Продолжить» → «Новые главы в закладках» («+3» на обложке) → плитки «Подборки» и «Источники» → «Из подборок» (одна лента последнего открытого источника) → «Давно не открывали».',
    pros: ['одна форма карточки на всей странице', 'обложки крупные — тайтлы узнаются сразу'],
    cons: [
      'четыре одинаковые ленты — снова каша, только из своего',
      'блоки различаются лишь заголовками',
    ],
  },
  {
    code: 'W2',
    fill: HOME_FILL.MIXED,
    title: 'У каждого блока своя форма',
    description:
      'То же содержимое и порядок, но формы разные: «Продолжить» — лента C1a, «Новые главы» — список строк в две колонки с «+3 гл.», «Из подборок» — лента, «Давно не открывали» — ряд маленьких обложек без подписей.',
    pros: [
      'блоки отличаются с первого взгляда, не по заголовку',
      'новые главы читаются как список дел — что открыть',
    ],
    cons: [
      'больше разных компонентов',
      'маленькие обложки без названий узнаются хуже, название — только в тултипе',
    ],
  },
  {
    code: 'W3',
    fill: HOME_FILL.ZONES,
    title: 'Зоны «моё» и «новое на сайтах»',
    description:
      'Сверху на тонированной подложке — всё своё: «Продолжить», «Новые главы» списком, «Давно не открывали» обложками. Ниже — «Новое на сайтах»: плитки и «Из подборок».',
    pros: [
      'граница «моё / новое» видна сразу — ровно то, что мешало',
      'внутри зоны блоки разной формы, как в W2',
    ],
    cons: [
      'подложка на пол-экрана',
      'плитки и подборки уходят ниже первого экрана, особенно на телефоне',
    ],
  },
];

/** Ось W — чем наполнить главную V2a, чтобы она не была пустой и не стала кашей. */
function FillSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="W"
        title="Наполнение главной"
        description="Главная P4a + V2a и три новых блока: «Новые главы в закладках», «Из подборок», «Давно не открывали». Блок без данных не рисуется. «Новые главы» ведут в закладки, «Из подборок» — на страницу подборок своего источника."
      />
      {VARIANTS.map(({ code, fill, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <HomeFilledPage fill={fill} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default FillSection;
