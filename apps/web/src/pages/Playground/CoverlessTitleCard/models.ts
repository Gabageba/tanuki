import type { EnumLiteralsOf, SORT_ORDER, Title } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import type { SectionNavGroup } from '../components/SectionNav';

export const CARD_DENSITY = { COMPACT: 0, SHORT: 2, DETAILED: 4 } as const;
export type CardDensity = EnumLiteralsOf<typeof CARD_DENSITY>;
export const FOLDER_MARK = {
  HEADING_ICON: 'headingIcon',
  HEADING_NAME: 'headingName',
  META_ICON: 'metaIcon',
  META_NAME: 'metaName',
} as const;
export type FolderMark = EnumLiteralsOf<typeof FOLDER_MARK>;
export const FOLDER_MARK_APPEARANCE = { SQUARE: 'square', TAG: 'tag' } as const;
export type FolderMarkAppearance = EnumLiteralsOf<typeof FOLDER_MARK_APPEARANCE>;
export const FOLDER_MARK_POSITION = {
  FOOTER: 'footer',
  HEADING_START: 'headingStart',
  HEADING_END: 'headingEnd',
} as const;
export type FolderMarkPosition = EnumLiteralsOf<typeof FOLDER_MARK_POSITION>;
export type FolderDecoration = { appearance: FolderMarkAppearance; position: FolderMarkPosition };
export const AGE_BADGE_POSITION = {
  HEADING_START: 'headingStart',
  HEADING_END: 'headingEnd',
} as const;
export type AgeBadgePosition = EnumLiteralsOf<typeof AGE_BADGE_POSITION>;
export const META_LAYOUT = { FOOTER: 'footer', SEPARATE: 'separate' } as const;
export type MetaLayout = EnumLiteralsOf<typeof META_LAYOUT>;
export const PANEL_LAYOUT = { ROW: 'row', STACKED: 'stacked' } as const;
export type PanelLayout = EnumLiteralsOf<typeof PANEL_LAYOUT>;
export const EXAMPLE_SET = { REGULAR: 'regular', EDGE: 'edge', SINGLE: 'single' } as const;
export type ExampleSet = EnumLiteralsOf<typeof EXAMPLE_SET>;
export const FEED_STATE = {
  READY: 'ready',
  LOADING: 'loading',
  EMPTY: 'empty',
  UNAVAILABLE: 'unavailable',
  LOCKED: 'locked',
} as const;
export type FeedState = EnumLiteralsOf<typeof FEED_STATE>;
export const SECTION = { POPULAR: 'popular', NEW: 'new' } as const;
export type Section = EnumLiteralsOf<typeof SECTION>;
export type PopularOrder = typeof SORT_ORDER.LIKES | typeof SORT_ORDER.VIEWS;

export type Example = { title: Title; folder: ResolvedBookmarkFolder | null };
export type CardOptions = {
  density?: CardDensity;
  folderMark?: FolderMark;
  folderDecoration?: FolderDecoration;
  metaLayout?: MetaLayout;
  tagLines?: number;
  columns?: number;
  current?: boolean;
  ageBadgePosition?: AgeBadgePosition;
};
export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  options: CardOptions;
};

export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Выбранная комбинация', axes: [{ letter: '★', title: 'Итог' }] },
  {
    title: 'Карточка',
    axes: [
      { letter: 'C', title: 'Плотность' },
      { letter: 'M', title: 'Метка папки' },
      { letter: 'T', title: 'Сведения и теги' },
    ],
  },
  {
    title: 'Выдача',
    axes: [
      { letter: 'P', title: 'Месяц и сортировка' },
      { letter: 'L', title: 'Колонки и полный месяц' },
      { letter: 'S', title: 'Состояния' },
    ],
  },
];

/** Выбранные части дизайна; оформление и положение папки ещё сравниваются. */
export const REFINED_CARD_OPTIONS: CardOptions = {
  density: CARD_DENSITY.SHORT,
  metaLayout: META_LAYOUT.FOOTER,
  tagLines: 1,
  columns: 2,
};

export const FINAL_COMBINATION = 'C2 + T1a + M9 + P2 + L2';
export const FINAL_CARD_OPTIONS: CardOptions = {
  ...REFINED_CARD_OPTIONS,
  folderDecoration: {
    appearance: FOLDER_MARK_APPEARANCE.TAG,
    position: FOLDER_MARK_POSITION.HEADING_START,
  },
  ageBadgePosition: AGE_BADGE_POSITION.HEADING_END,
};

export const REFINED_FOLDER_VARIANTS: Variant[] = [
  {
    code: 'M5',
    title: 'Тёмный квадрат перед тегами',
    description:
      'Общая метка TitleBookmarkMarker, как на остальных карточках: 22 px, тёмная подложка и светлая иконка цвета папки. В левом нижнем углу, перед тегами.',
    pros: ['Сохраняет привычное оформление и левый нижний угол', 'Не сужает название'],
    cons: ['Меньше места для тегов', 'Тёмная подложка заметнее в светлой теме'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.SQUARE,
        position: FOLDER_MARK_POSITION.FOOTER,
      },
    },
  },
  {
    code: 'M6',
    title: 'Тёмный квадрат перед 18+',
    description:
      'Тот же общий маркер, но в начале заголовка, рядом с 18+. Нижняя строка остаётся целиком для тегов и лайков.',
    pros: ['Папка заметна в начале карточки', 'Теги сохраняют ширину'],
    cons: ['Название получает меньше места', 'Два маркера подряд перед названием'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.SQUARE,
        position: FOLDER_MARK_POSITION.HEADING_START,
      },
    },
  },
  {
    code: 'M7',
    title: 'Тёмный квадрат справа от названия',
    description:
      'Привычный маркер в правом верхнем углу. Длинное имя папки остаётся в подсказке и не влияет на ширину метки.',
    pros: ['Теги сохраняют ширину', 'Ширина метки не зависит от имени папки'],
    cons: ['Папка отделена от 18+ и тегов', 'Название сужается на ширину метки'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.SQUARE,
        position: FOLDER_MARK_POSITION.HEADING_END,
      },
    },
  },
  {
    code: 'M8',
    title: 'Тег с иконкой перед тегами',
    description:
      'Компактный тег без текста: залитая иконка, лёгкая подложка и обводка цвета папки. На том же месте, что тёмный квадрат M5.',
    pros: ['Сочетается с оформлением остальных тегов', 'Не сужает название'],
    cons: ['Меньше места для тегов', 'Может восприниматься как ещё один жанр'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.TAG,
        position: FOLDER_MARK_POSITION.FOOTER,
      },
    },
  },
  {
    code: 'M9',
    title: 'Тег с иконкой перед 18+',
    description:
      'Тот же цветной тег с одной иконкой, рядом с 18+. Сравнение с M6 меняет только оформление маркера.',
    pros: ['Все маркеры собраны у названия', 'Нет тёмной подложки в светлой теме'],
    cons: ['Название получает меньше места', 'В начале строки стоят два тега'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.TAG,
        position: FOLDER_MARK_POSITION.HEADING_START,
      },
    },
  },
  {
    code: 'M10',
    title: 'Тег с иконкой справа от названия',
    description:
      'Тег цвета папки в правом верхнем углу, без имени. Сравнение с M7 меняет только оформление маркера.',
    pros: ['Теги сохраняют ширину', 'Лёгкая подложка работает в обеих темах'],
    cons: ['Папка отделена от остальных тегов', 'Название сужается на ширину метки'],
    options: {
      ...REFINED_CARD_OPTIONS,
      folderDecoration: {
        appearance: FOLDER_MARK_APPEARANCE.TAG,
        position: FOLDER_MARK_POSITION.HEADING_END,
      },
    },
  },
];

export const DENSITY_VARIANTS: Variant[] = [
  {
    code: 'C0',
    title: 'Нынешняя карточка с пустой обложкой',
    description:
      'Настоящий SourceTitleCard на тех же данных. Это сравнение компонента: самого блока «Популярные» в приложении пока нет.',
    pros: ['Сохраняет существующую анатомию карточки'],
    cons: ['Пустая обложка занимает 120 px', 'Без картинки карточки труднее различать'],
    options: { current: true },
  },
  {
    code: 'C1',
    title: 'Компактная, без описания',
    description: 'Название до двух строк; ниже теги и лайки. Место обложки полностью убрано.',
    pros: ['Больше тайтлов на экране', 'Длинному названию доступна вся ширина'],
    cons: ['Сюжет можно узнать только после перехода'],
    options: { density: CARD_DENSITY.COMPACT },
  },
  {
    code: 'C2',
    title: 'Две строки описания',
    description:
      'Между названием и тегами — короткий фрагмент описания. Название по-прежнему занимает до двух строк.',
    pros: ['Контекст виден без перехода', 'Карточка ниже подробной C3'],
    cons: ['Описание часто обрывается до сути'],
    options: { density: CARD_DENSITY.SHORT },
  },
  {
    code: 'C3',
    title: 'Четыре строки описания',
    description: 'Больше места для сюжета, при том же составе метаданных и размере названия.',
    pros: ['Можно прочитать больше до перехода'],
    cons: ['Полный месяц требует больше прокрутки', 'Разная длина описаний даёт разную высоту'],
    options: { density: CARD_DENSITY.DETAILED },
  },
];

export const FOLDER_VARIANTS: Variant[] = [
  {
    code: 'M1',
    title: 'Иконка возле названия',
    description:
      'Залитая иконка цвета папки перед названием; имя доступно при наведении и фокусе ссылки.',
    pros: ['Метка занимает только ширину иконки'],
    cons: ['На телефоне имя папки не видно сразу'],
    options: { folderMark: FOLDER_MARK.HEADING_ICON },
  },
  {
    code: 'M2',
    title: 'Имя возле названия',
    description:
      'Цветная метка с иконкой и именем справа от названия. Длинное имя ограничено по ширине.',
    pros: ['Папку можно узнать без подсказки'],
    cons: ['Название тайтла получает меньше места'],
    options: { folderMark: FOLDER_MARK.HEADING_NAME },
  },
  {
    code: 'M3',
    title: 'Иконка в сведениях',
    description: 'Маленькая цветная иконка отдельной строкой под названием, с именем в подсказке.',
    pros: ['Не сужает название'],
    cons: ['Добавляет строку ради одной иконки', 'Имя папки скрыто'],
    options: { folderMark: FOLDER_MARK.META_ICON },
  },
  {
    code: 'M4',
    title: 'Имя в сведениях',
    description: 'Иконка и имя папки под названием. Если папки нет, строка исчезает целиком.',
    pros: ['Название сохраняет ширину', 'Имя папки видно сразу'],
    cons: ['Сохранённые тайтлы выше остальных'],
    options: { folderMark: FOLDER_MARK.META_NAME },
  },
];

export const META_VARIANTS: Variant[] = [
  {
    code: 'T1a',
    title: 'Лайки рядом с тегами · одна строка',
    description:
      '18+ перед названием. Лайки справа от единственной строки тегов; остаток скрыт за +N.',
    pros: ['Нижняя строка компактна', 'Лайки выровнены справа'],
    cons: ['Счётчик уменьшает место для тегов'],
    options: { metaLayout: META_LAYOUT.FOOTER, tagLines: 1 },
  },
  {
    code: 'T1b',
    title: 'Лайки рядом с тегами · две строки',
    description: 'Та же компоновка, но теги занимают до двух строк. Лайки остаются у правого края.',
    pros: ['Видно больше тегов'],
    cons: ['Карточки с большим числом тегов выше'],
    options: { metaLayout: META_LAYOUT.FOOTER, tagLines: 2 },
  },
  {
    code: 'T2a',
    title: 'Отдельная строка сведений · одна строка тегов',
    description:
      '18+ и лайки под названием. Теги внизу получают всю ширину, папка — в выбранной для неё позиции.',
    pros: ['Теги не конкурируют с лайками', 'Название не сужается меткой 18+'],
    cons: ['Добавляется строка метаданных'],
    options: { metaLayout: META_LAYOUT.SEPARATE, tagLines: 1 },
  },
  {
    code: 'T2b',
    title: 'Отдельная строка сведений · две строки тегов',
    description: 'Свободная строка сведений и до двух строк тегов с +N для остатка.',
    pros: ['Больше всего места для тегов'],
    cons: ['Самый высокий вариант метаданных'],
    options: { metaLayout: META_LAYOUT.SEPARATE, tagLines: 2 },
  },
];

export const LAYOUT_VARIANTS: Variant[] = [
  {
    code: 'L1',
    title: 'Одна колонка',
    description:
      'Двенадцать вымышленных тайтлов по порядку: сверху вниз. Компактная C1 помогает оценить длину месяца.',
    pros: ['Однозначный порядок рейтинга', 'Максимум ширины под название'],
    cons: ['Меньше тайтлов на одном экране'],
    options: { columns: 1, density: CARD_DENSITY.COMPACT },
  },
  {
    code: 'L2',
    title: 'Две колонки на десктопе',
    description:
      'Те же тайтлы: слева направо, затем следующая строка. На телефоне остаётся одна колонка.',
    pros: ['Меньше прокрутки для полного месяца'],
    cons: ['Названия обрезаются чаще', 'Рейтинг приходится читать по строкам'],
    options: { columns: 2, density: CARD_DENSITY.COMPACT },
  },
];
