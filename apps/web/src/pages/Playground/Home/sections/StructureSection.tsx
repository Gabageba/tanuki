import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import CatalogSiteHomeMock from '../components/CatalogSiteHomeMock';
import DiscoverPageMock from '../components/DiscoverPageMock';
import HomeByMeaningPage from '../components/HomeByMeaningPage';
import HomeEntryPage from '../components/HomeEntryPage';
import HomeOneSourcePage from '../components/HomeOneSourcePage';
import HomeSummaryPage from '../components/HomeSummaryPage';
import HomeTabsPage from '../components/HomeTabsPage';
import HomeZonesPage from '../components/HomeZonesPage';
import { HOME_MANGALIB } from '../mocks';
import { SELECTIONS_ENTRY, SOURCE_PICKER } from '../models';

const VARIANTS: {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  /** Страницы варианта: у отдельной страницы подборок — главная и куда с неё попадают. */
  pages: { label: string; content: ReactNode }[];
}[] = [
  {
    code: 'P0',
    title: 'Как в «Итоге»',
    description:
      '«Продолжить чтение», ниже все источники подряд, у каждого вкладки блоков (S2b) и одна лента.',
    pros: ['всё на одном экране, без переходов'],
    cons: [
      '«Продолжить» и подборки — одинаковые ленты обложек, «моё» не отличить',
      'источник на источнике: десятки лент, границы между сайтами — только линия',
    ],
    pages: [{ label: 'главная', content: <HomeSummaryPage isLoading={false} /> }],
  },
  {
    code: 'P1',
    title: 'Зоны разного вида',
    description:
      '«Продолжить» — на акцентной подложке, отдельно от всего. Ниже «Подборки источников»: каждый источник начинается плашкой своего цвета с логотипом и «Каталог →».',
    pros: [
      '«моё» видно сразу — оно единственное на подложке',
      'граница сайтов заметна даже при быстрой прокрутке',
    ],
    cons: [
      'лент столько же, сколько в P0 — объём не уменьшился',
      'цветные плашки всех сайтов подряд — пёстро',
    ],
    pages: [{ label: 'главная', content: <HomeZonesPage /> }],
  },
  {
    code: 'P2',
    title: 'Вкладки «Моё» / «Подборки»',
    description:
      'Вверху главной — вкладки. «Моё» — «Продолжить чтение» сеткой (лента на вкладке одна, сетка показывает все 20 сразу). «Подборки» — источники подряд, как в P0.',
    pros: [
      'две задачи не мешают друг другу',
      'в «Моё» видно все начатые тайтлы без прокрутки вбок',
    ],
    cons: [
      'подборок не видно, пока не переключишь — их легко забыть',
      'во вкладке «Подборки» каша P0 никуда не делась',
    ],
    pages: [{ label: 'главная', content: <HomeTabsPage /> }],
  },
  {
    code: 'P3a',
    title: 'Один источник за раз — чипы',
    description:
      '«Продолжить», ниже «Подборки источников»: строка чипов с логотипами и под ней все блоки выбранного источника лентами. Вкладки блоков не нужны — источник один. В приложении открыт последний выбранный.',
    pros: [
      'лент 2–6, а не десятки: смотришь один сайт',
      'чей источник — не вопрос, он выбран явно',
      'чипы показывают, какие ещё сайты есть',
    ],
    cons: ['чтобы посмотреть другие сайты — переключать по одному', 'на телефоне чипы листаются'],
    pages: [{ label: 'главная', content: <HomeOneSourcePage picker={SOURCE_PICKER.CHIPS} /> }],
  },
  {
    code: 'P3b',
    title: 'Один источник за раз — кнопка со списком',
    description: 'То же, что P3a, но источник выбирается кнопкой «[R] Реманга ▾», как в шапке.',
    pros: ['компактно на любой ширине', 'знакомый по шапке приём'],
    cons: [
      'какие ещё источники есть, видно только в списке',
      'два похожих выбора источника на экране — в шапке и здесь, а делают разное',
    ],
    pages: [{ label: 'главная', content: <HomeOneSourcePage picker={SOURCE_PICKER.SELECT} /> }],
  },
  {
    code: 'P3c',
    title: 'Один источник за раз — логотипы',
    description:
      'То же, что P3a, но источники — круглыми логотипами без подписей, выбранный в акцентном кольце, название в тултипе.',
    pros: ['самая короткая строка выбора', 'логотипы узнаются быстрее названий'],
    cons: [
      'без подписей похожие логотипы путаются, на телефоне тултипа нет',
      'новый для приложения приём',
    ],
    pages: [{ label: 'главная', content: <HomeOneSourcePage picker={SOURCE_PICKER.LOGOS} /> }],
  },
  {
    code: 'P4a',
    title: 'Отдельная страница — вход карточками',
    description:
      'Главная — «Продолжить» и сетка карточек источников (логотип, сколько подборок, три обложки). Карточка ведёт на страницу «Подборки» этого источника (справа — как после нажатия на MangaLib): чипы источников и его блоки, «Назад» — на главную.',
    pros: [
      'главная короткая и про «моё»',
      'обложки в карточке показывают, что внутри, — хочется зайти',
    ],
    cons: ['до подборок на переход больше', 'новый раздел и адрес (/discover) — план меняется'],
    pages: [
      { label: 'главная', content: <HomeEntryPage entry={SELECTIONS_ENTRY.CARDS} /> },
      { label: 'подборки', content: <DiscoverPageMock initialId={HOME_MANGALIB.source.id} /> },
    ],
  },
  {
    code: 'P4b',
    title: 'Отдельная страница — одна строка',
    description:
      'Главная — «Продолжить» и одна плашка «Подборки источников →». Страница подборок та же, что в P4a.',
    pros: ['главная — почти только «Продолжить»'],
    cons: ['подборки легко не заметить вовсе', 'новый раздел и адрес — как в P4a'],
    pages: [
      { label: 'главная', content: <HomeEntryPage entry={SELECTIONS_ENTRY.LINK} /> },
      { label: 'подборки', content: <DiscoverPageMock /> },
    ],
  },
  {
    code: 'P4c',
    title: 'Подборки на каталоге источника',
    description:
      'Подборки сайта — вкладка «Главная сайта» на странице каталога, рядом с самим каталогом. На нашей главной — «Продолжить» и карточки источников, ведущие на эту вкладку.',
    pros: ['подборки живут там, где источник, — нечему смешиваться', 'нового раздела нет'],
    cons: [
      'страница каталога усложняется вкладками',
      'посмотреть новое — зайти в каждый источник отдельно',
    ],
    pages: [
      { label: 'главная', content: <HomeEntryPage entry={SELECTIONS_ENTRY.CATALOG_TAB} /> },
      { label: 'каталог Реманги', content: <CatalogSiteHomeMock /> },
    ],
  },
  {
    code: 'P5',
    title: 'Свести по смыслу',
    description:
      'Три ленты на всю страницу — «Новинки», «Популярное», «Обновления» — со всех источников вперемешку, у карточки лента источника. Чипы источников сверху сужают все три ленты; ни один не выбран — все.',
    pros: [
      'три ленты вместо десятков',
      'тайтлы перемешаны, а не стопками по сайтам — видно лучшее со всех',
    ],
    cons: [
      'меняет план: свой перечень видов и раскладка блоков каждого парсера',
      'названия блоков сайтов пропадают; «Топ-5 недели» и т. п. ложатся неточно',
      'один хит повторяется в ленте по разу от каждого сайта',
    ],
    pages: [{ label: 'главная', content: <HomeByMeaningPage /> }],
  },
];

/** Ось P — как устроена главная, чтобы «моё» и подборки разных сайтов не сливались в кашу. */
function StructureSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="P"
        title="Устройство страницы"
        description="Варианты целиком, не комбинируются. Повторы не убираются: тайтл может быть и в «Продолжить», и в подборках. «Продолжить» везде C1a, источники — Реманга, MangaLib, Desu, Senkuro, ReadManga. У отдельной страницы показаны обе страницы."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, pages }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Stack gap="xl">
            {pages.map(({ label, content }) => (
              <VariantFrames
                key={label}
                desktopLabel={`Десктоп · ${label}`}
                phoneLabel={`375 px · ${label}`}
              >
                {content}
              </VariantFrames>
            ))}
          </Stack>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default StructureSection;
