import { Stack } from '@mantine/core';
import AxisHeading from '../../Bookmarks/components/AxisHeading';
import FiltersCatalogCard from '../components/FiltersCatalogCard';
import CatalogLikeSheet from '../components/CatalogLikeSheet';
import FiltersCatalogExact from '../components/FiltersCatalogExact';
import FiltersChips from '../components/FiltersChips';
import FiltersMenus from '../components/FiltersMenus';
import FiltersSelects from '../components/FiltersSelects';
import FiltersSheetMock from '../components/FiltersSheetMock';
import FiltersSidebar from '../components/FiltersSidebar';
import ResultsPreview from '../components/ResultsPreview';
import VariantFrames from '../components/VariantFrames';
import VariantList from '../components/VariantList';
import type { Variant } from '../models';

const SHEET = '375 px · drawer «Фильтры»';

const VARIANTS: Variant[] = [
  {
    code: 'F0',
    title: 'Как сейчас',
    description: 'Фильтров нет: опрашиваются все включённые источники, тип и статус любые.',
    pros: ['Ничего не отнимает места'],
    cons: ['Нечем отсечь лишние источники и типы — только отключать источники в настройках'],
    render: () => (
      <VariantFrames>
        <ResultsPreview />
      </VariantFrames>
    ),
  },
  {
    code: 'F1',
    title: 'Боковая колонка',
    description:
      'Как в плане: три группы чекбоксов слева, всегда открыты, выбор применяется сразу. На телефоне — «Фильтры» со счётчиком и drawer с теми же группами.',
    pros: ['Всё видно сразу, фильтр — в один клик', 'Источники — с логотипами'],
    cons: [
      'Каждый клик перезапускает веер до 5 с — три галочки подряд = три ожидания',
      'Выдача уже на 250 px — обложки в сетке мельче',
    ],
    render: () => (
      <VariantFrames extraPhones={[{ label: SHEET, content: <FiltersSheetMock /> }]}>
        <FiltersSidebar />
      </VariantFrames>
    ),
  },
  {
    code: 'F2',
    title: 'Как в каталоге',
    description:
      'Кнопка «Фильтры» раскрывает над выдачей карточку с вертикальными вкладками групп; выбор — пачкой по «Применить». На телефоне — кнопка и drawer.',
    pros: ['Тот же приём, что в каталоге источника', 'Один запрос на всю пачку изменений'],
    cons: [
      'Три коротких группы прячутся во вкладки — ради пяти галочек лишний клик',
      'Открытая карточка сталкивает выдачу вниз',
    ],
    render: () => (
      <VariantFrames extraPhones={[{ label: SHEET, content: <FiltersSheetMock /> }]}>
        <FiltersCatalogCard />
      </VariantFrames>
    ),
  },
  {
    code: 'F3',
    title: 'Три CompactMultiSelect в строку',
    description:
      'Источники, тип и статус — три поля над выдачей, как фильтры в «Управлении»; выбор применяется сразу. На телефоне — столбиком, пилюли под ними.',
    pros: ['Одна строка высотой с поле', 'Тот же компонент, что в таблицах «Управления»'],
    cons: [
      'Логотипов источников в поле нет — только названия',
      'На десктопе пилюли не нужны — выбор и так виден в полях; на телефоне три поля — три строки',
    ],
    render: () => (
      <VariantFrames>
        <FiltersSelects />
      </VariantFrames>
    ),
  },
  {
    code: 'F4',
    title: 'Чипы для типа и статуса',
    description:
      'У типа и статуса по 5 значений — они видны чипами без открытия; источники, которых много, — выпадающим списком.',
    pros: ['Сразу видно, чем можно сузить, и что уже выбрано', 'Тип и статус — в один клик'],
    cons: [
      'Две полосы чипов над выдачей всегда, даже если фильтры не нужны',
      'На телефоне — четыре-пять строк до первой обложки',
    ],
    render: () => (
      <VariantFrames>
        <FiltersChips />
      </VariantFrames>
    ),
  },
  {
    code: 'F5',
    title: 'Кнопки-дропдауны',
    description:
      '«Источники ▾», «Тип ▾», «Статус ▾» — как у маркетплейсов: внутри чекбоксы и «Применить», на кнопке — сколько выбрано. На телефоне ряд листается вбок.',
    pros: ['Одна строка на любой ширине', 'Применение пачкой внутри группы'],
    cons: ['Что внутри, не видно, пока не откроешь', 'Три поповера вместо одного drawer'],
    render: () => (
      <VariantFrames>
        <FiltersMenus />
      </VariantFrames>
    ),
  },
  {
    code: 'F6',
    title: '1 в 1 как в каталоге',
    description:
      'Копия CatalogSettings без сортировки: «Фильтры» слева и вид карточек справа одной строкой, пилюли в рамке акцента под ними. Кнопка раскрывает CatalogFilterCard — вертикальные вкладки групп со счётчиком выбранного; на телефоне — CatalogFilterDrawer: «Все фильтры» списком групп, тап открывает группу.',
    pros: [
      'Тот же приём и вид, что в каталоге источника, — ничего нового учить не надо',
      'При реализации можно взять сами компоненты каталога, а не писать свои',
      'Один запрос на всю пачку изменений',
    ],
    cons: ['Ради трёх коротких групп — вкладки и лишний клик, как и в F2'],
    render: () => (
      <VariantFrames
        extraPhones={[{ label: '375 px · drawer «Все фильтры»', content: <CatalogLikeSheet /> }]}
      >
        <FiltersCatalogExact />
      </VariantFrames>
    ),
  },
];

/** Ось F — фильтры. */
function FiltersSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="F"
        title="Фильтры"
        description="Вопрос 7 плана. В плане — «боковая карточка как CatalogFilterCard», но в каталоге фильтры раскрываются кнопкой над выдачей; здесь оба способа и альтернативы. Фильтры живые; заранее выбраны «Манхва», «Маньхуа» и «Выходит»."
      />
      <VariantList variants={VARIANTS} />
    </Stack>
  );
}

export default FiltersSection;
