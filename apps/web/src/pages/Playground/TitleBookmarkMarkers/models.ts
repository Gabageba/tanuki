import type { BookmarkAvailability, EnumLiteralsOf, Title } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

export const MARKER_VARIANT = {
  CURRENT: 'current',
  BEFORE_NAME: 'beforeName',
  COVER_FLAG: 'coverFlag',
  FOLDER_PILL: 'folderPill',
} as const;
export type MarkerVariant = EnumLiteralsOf<typeof MARKER_VARIANT>;

export const EXAMPLE_SET = {
  BASIC: 'basic',
  EDGE_CASES: 'edgeCases',
} as const;
export type ExampleSet = EnumLiteralsOf<typeof EXAMPLE_SET>;

export type MarkerExample = {
  title: Title;
  folder: ResolvedBookmarkFolder | null;
  availability?: BookmarkAvailability;
};

export const VARIANTS = [
  {
    id: MARKER_VARIANT.CURRENT,
    code: 'M0',
    title: 'До выбора: справа от названия',
    description: 'Цветная иконка без подложки стоит у правого края строки названия.',
    pros: ['Не перекрывает обложку и не добавляет подпись в нижнюю строку'],
    cons: ['На широкой карточке отрывается от названия', 'Занимает место даже у длинного названия'],
  },
  {
    id: MARKER_VARIANT.BEFORE_NAME,
    code: 'M1',
    title: 'Перед названием',
    description:
      'Та же иконка 16 px стоит непосредственно перед названием и выровнена по первой строке.',
    pros: ['Папку замечаешь вместе с названием', 'Обложка и нижняя строка свободны'],
    cons: ['Название становится уже', 'Названия сохранённых тайтлов начинаются правее остальных'],
  },
  {
    id: MARKER_VARIANT.COVER_FLAG,
    code: 'M2',
    title: 'Флажок в углу обложки',
    description: 'Цветной флажок с белой иконкой папки свисает с правого верхнего края обложки.',
    pros: ['Название сохраняет всю ширину', 'Форма флажка сама напоминает о закладке'],
    cons: ['Перекрывает участок обложки', 'Иконка папки мельче, чем у M1'],
  },
  {
    id: MARKER_VARIANT.FOLDER_PILL,
    code: 'M3',
    title: 'Папка с подписью в нижней строке',
    description:
      'Плашка с оттенком цвета папки, иконкой и названием стоит перед тегами и оценкой; в компактном списке — перед сведениями о новых главах.',
    pros: ['Папка понятна без запоминания цвета и иконки', 'Название тайтла и обложка свободны'],
    cons: [
      'Вмещается меньше тегов',
      'На телефоне длинное имя папки и сведения о главах обрезаются',
    ],
  },
];

export const DESKTOP_CARD_WIDTH = 560;
export const MOBILE_CARD_WIDTH = 320;
