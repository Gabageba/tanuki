import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { SEL_MANGALIB } from '../mocks';
import { DRAFT_LOOK, LIST_PANEL, type ListPanel } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  panel: ListPanel;
};

const VARIANTS: Variant[] = [
  {
    code: 'H1',
    title: 'Панель, кнопка «Каталог» высотой с переключатели',
    description:
      'Над сеткой одна строка: слева период, справа «Каталог» и сетка/список. Кнопка `sm` — той же высоты, что переключатели, строка ровная. У блока без фильтров слева пусто, строка на месте.',
    pros: [
      'Всё управление списком — одна строка, как в каталоге',
      'Шапка не прыгает между вкладками с периодом и без',
      'Подпись короткая: источник назван в шапке',
    ],
    cons: ['Без фильтров строка выглядит полупустой'],
    panel: LIST_PANEL.BUTTON_SM,
  },
  {
    code: 'H2',
    title: 'Панель, кнопка xs «Каталог: MangaLib»',
    description: 'То же место, но кнопка мельче и подписана полностью — L4 буквально.',
    pros: ['Дословно прошлое решение L4'],
    cons: [
      'Кнопка ниже переключателей — строка неровная',
      'Название источника повторено рядом с шапкой',
    ],
    panel: LIST_PANEL.BUTTON_XS,
  },
  {
    code: 'H3',
    title: 'Кнопка у источника, в панели — фильтры и вид',
    description:
      'Кнопка xs «Каталог: MangaLib» справа от заголовка источника, как задумывался L4; над сеткой — только период и сетка/список.',
    pros: ['Каталог стоит у своего источника, а не у списка блока'],
    cons: [
      'Две строки управления над сеткой',
      'Без фильтров в панели остаётся один переключатель вида',
    ],
    panel: LIST_PANEL.HEADER_BUTTON,
  },
];

/** Ось H — панель над сеткой; каждый вариант на вкладке с периодом и без фильтров. */
function PanelSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Панель над сеткой"
        description="Шапка — только источник и вкладки; фильтры блока, вид и каталог собраны в строку над сеткой, каталог — кнопкой с книгами. Каждый вариант дважды: «Сейчас читают: новинки» MangaLib (есть период) и «Популярное» (фильтров нет) — видно, прыгает ли шапка."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, panel }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <Stack gap="lg">
            <VariantFrames desktopLabel="Десктоп · с периодом" phoneLabel="375 px · с периодом">
              <SelectionsMock
                look={{ ...DRAFT_LOOK, panel }}
                initialSourceId={SEL_MANGALIB.source.id}
                initialBlockId="readingNowNew"
              />
            </VariantFrames>
            <VariantFrames desktopLabel="Десктоп · без фильтров" phoneLabel="375 px · без фильтров">
              <SelectionsMock
                look={{ ...DRAFT_LOOK, panel }}
                initialSourceId={SEL_MANGALIB.source.id}
                initialBlockId="popular"
              />
            </VariantFrames>
          </Stack>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PanelSection;
