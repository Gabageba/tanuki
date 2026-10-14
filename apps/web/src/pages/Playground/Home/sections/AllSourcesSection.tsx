import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomePageMock from '../components/HomePageMock';
import { ALL_SOURCES_PLACE, type AllSourcesPlace } from '../models';

const VARIANTS: {
  code: string;
  place: AllSourcesPlace;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'A1',
    place: ALL_SOURCES_PLACE.PAGE_TITLE,
    title: 'Кнопка у заголовка страницы',
    description:
      'Как у других страниц в PageLayout: заголовок «Главная», справа кнопка «Все источники» (как «Здоровье источников» на /sources).',
    pros: [
      'видна сразу, на первом экране и на телефоне',
      'та же схема заголовка, что у всех страниц приложения',
    ],
    cons: [
      'заголовок «Главная» на главной — лишняя строка над главным',
      'подборки идут без подписи — секции начинаются сразу после «Продолжить»',
    ],
  },
  {
    code: 'A2',
    place: ALL_SOURCES_PLACE.ABOVE_SECTIONS,
    title: 'Строка над подборками',
    description:
      'Заголовок страницы без кнопки; между «Продолжить чтение» и секциями — подзаголовок «Подборки источников» и «Все источники →» справа.',
    pros: [
      'ссылка там, где речь об источниках',
      'две части страницы подписаны одинаково — «Продолжить чтение» и «Подборки источников»',
    ],
    cons: [
      'ниже «Продолжить» — на телефоне уходит за первый экран',
      'заголовок «Главная» остаётся',
    ],
  },
  {
    code: 'A3',
    place: ALL_SOURCES_PLACE.NO_PAGE_TITLE,
    title: 'Без заголовка страницы',
    description:
      'Страница начинается сразу с «Продолжить чтение»; «Все источники →» — в строке «Подборки источников», как в A2.',
    pros: [
      'первый экран — сразу тайтлы, на телефоне выигрыш ~70 px',
      'где ты, и так видно: «Главная» подсвечена в шапке или нижней панели',
    ],
    cons: [
      'единственная страница без заголовка',
      'новый пользователь без «Продолжить» видит сразу «Подборки источников» — непонятно, что это главная',
    ],
  },
];

/** Ось A — где «Все источники»; заодно — страница целиком. */
function AllSourcesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="A"
        title="«Все источники» и страница целиком"
        description="Главная целиком: «Продолжить чтение» (C1), две секции (S1 + L1), «Не ответили» (N5 из поиска). Меняется только место «Все источники» и заголовок страницы."
      />
      {VARIANTS.map(({ code, place, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <HomePageMock place={place} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default AllSourcesSection;
