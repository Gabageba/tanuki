import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { BASE_LOOK, PICKER_PLACEMENT, SOURCE_PICKER, type PickerPlacement } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  placement: PickerPlacement;
};

const VARIANTS: Variant[] = [
  {
    code: 'M1',
    title: 'Своей строкой под заголовком',
    description: 'Селектор слева, «Каталог» и сетка/список справа, вкладки — строкой ниже.',
    pros: ['Всё управление источником в одной строке', 'Вкладки получают всю ширину'],
    cons: ['Три ряда до первой карточки'],
    placement: PICKER_PLACEMENT.BELOW_TITLE,
  },
  {
    code: 'M2',
    title: 'В строке заголовка «Подборки»',
    description:
      'Селектор справа от заголовка страницы, как кнопки страницы; ниже вкладки и справа от них «Каталог» с видом.',
    pros: ['На десктопе на ряд меньше', 'Источник читается как часть заголовка страницы'],
    cons: [
      'На телефоне всё равно уходит под заголовок',
      '«Каталог» отрывается от источника и встаёт к вкладкам',
    ],
    placement: PICKER_PLACEMENT.IN_TITLE,
  },
  {
    code: 'M3',
    title: 'В одной строке с вкладками',
    description:
      'Селектор слева, за чертой — вкладки блоков; «Каталог» и вид — в строке заголовка страницы.',
    pros: ['Самый компактный десктоп: выбор источника и блока — одна строка'],
    cons: [
      'Вкладкам Реманги и MangaLib не хватает места — листаются уже на десктопе',
      'Селектор и вкладки сливаются в один ряд с разной логикой',
    ],
    placement: PICKER_PLACEMENT.WITH_TABS,
  },
];

/** Ось M — где стоит выбор источника. */
function PlacementSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="M"
        title="Место селектора"
        description="Куда встаёт выбор источника вместе с «Каталог: …» и переключателем вида. Селектор здесь — поле S1: оно встаёт в любую строку, а место от формы почти не зависит. Различия видны на десктопе; на телефоне всё идёт столбиком."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, placement }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <SelectionsMock look={{ ...BASE_LOOK, picker: SOURCE_PICKER.SELECT, placement }} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PlacementSection;
