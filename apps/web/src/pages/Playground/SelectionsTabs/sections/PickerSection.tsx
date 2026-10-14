import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { BASE_LOOK, SOURCE_PICKER, type SourcePicker } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  picker: SourcePicker;
};

const VARIANTS: Variant[] = [
  {
    code: 'S0',
    title: 'Чипы, как сейчас',
    description:
      'Чипы источников остаются строкой над заголовком источника, под ними — вкладки блоков.',
    pros: ['Источник меняется без лишнего клика', 'Ничего не меняется для тех, кто привык'],
    cons: [
      'Два ряда переключателей подряд — то, за что вкладки блоков отвергли в прошлый раз',
      'Источник назван дважды: чипом и заголовком',
    ],
    picker: SOURCE_PICKER.CHIPS,
  },
  {
    code: 'S1',
    title: 'Поле Select с логотипами',
    description:
      'Обычное поле: логотип выбранного источника слева, в списке логотипы и поиск по названию.',
    pros: ['Привычный элемент, поиск по 10–20 источникам', 'Узкое — встаёт в любую строку'],
    cons: ['Выглядит как фильтр формы, а не как «где я»', 'Домена источника не видно'],
    picker: SOURCE_PICKER.SELECT,
  },
  {
    code: 'S2',
    title: 'Заголовок-переключатель',
    description:
      'Заголовок источника — логотип, название, домен — сам кнопка с кареткой; по клику список источников.',
    pros: ['Заголовок и выбор слиты: меньше всего места', 'Сразу видно, чьи подборки открыты'],
    cons: [
      'Не всем очевидно, что заголовок нажимается',
      'Похож на выбор источника в шапке приложения, но меняет другое',
    ],
    picker: SOURCE_PICKER.TITLE_MENU,
  },
  {
    code: 'S3',
    title: 'Кнопка и drawer с плитками',
    description:
      'Кнопка с выбранным источником открывает drawer: плитки с крупным логотипом и доменом — на телефоне снизу, на десктопе сбоку.',
    pros: ['Крупные цели под палец', 'Логотипы узнаются быстрее названий'],
    cons: ['Самый тяжёлый путь: drawer ради одного выбора', 'Нет поиска'],
    picker: SOURCE_PICKER.DRAWER,
  },
];

/** Ось S — форма выбора источника в раскладке R1. */
function PickerSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Форма селектора"
        description="Чем выбирается источник в раскладке R1. Остальное — как в R1: селектор своей строкой (M1), вкладки с подчёркиванием (T1)."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, picker }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <SelectionsMock look={{ ...BASE_LOOK, picker }} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default PickerSection;
