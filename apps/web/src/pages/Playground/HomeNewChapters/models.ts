import type { BookmarkItem, EnumLiteralsOf } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import type { SectionNavGroup } from '../components/SectionNav';

export const META_VARIANT = {
  CURRENT: 'current',
  SEPARATOR: 'separator',
  TEXT_SOURCE: 'textSource',
  FOLDER_RIGHT: 'folderRight',
} as const;
export type MetaVariant = EnumLiteralsOf<typeof META_VARIANT>;

export const CARD_VARIANT = {
  CURRENT: 'current',
  COMPACT: 'compact',
  TITLE_FIRST: 'titleFirst',
  SOFT_ACCENT: 'softAccent',
  DIMMED: 'dimmed',
  BADGE: 'badge',
  ICON_BADGE: 'iconBadge',
  NUMBER_BADGE: 'numberBadge',
  COMBINED_META: 'combinedMeta',
  COLORED_COUNT: 'coloredCount',
  BOLD_COLORED_COUNT: 'boldColoredCount',
} as const;
export type CardVariant = EnumLiteralsOf<typeof CARD_VARIANT>;
export type CombinedMetaVariant =
  | typeof CARD_VARIANT.COMBINED_META
  | typeof CARD_VARIANT.COLORED_COUNT
  | typeof CARD_VARIANT.BOLD_COLORED_COUNT;
export type CounterVariant = Exclude<
  CardVariant,
  | typeof CARD_VARIANT.CURRENT
  | typeof CARD_VARIANT.COMPACT
  | typeof CARD_VARIANT.TITLE_FIRST
  | CombinedMetaVariant
>;
export type UpdateVariant = CounterVariant | CombinedMetaVariant;

export type VariantDemo = {
  id: CardVariant;
  metaVariant?: MetaVariant;
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

export type ChapterExample = {
  bookmark: BookmarkItem;
  folder: ResolvedBookmarkFolder | null;
  typeLabel: string;
};

export const COMPACT_COVER_WIDTH = 64;

export const SECTION_GROUPS: SectionNavGroup[] = [
  {
    title: 'Карточки новых глав',
    axes: [
      { letter: 'A', title: 'Счётчик обновлений' },
      { letter: 'P', title: 'Прежние варианты' },
      { letter: 'M', title: 'Мета-строка · основа A9' },
      { letter: 'R', title: 'Итог · A9 + M2' },
    ],
  },
];

export const RESULT_VARIANT: VariantDemo = {
  id: CARD_VARIANT.COLORED_COUNT,
  metaVariant: META_VARIANT.TEXT_SOURCE,
  code: 'A9 + M2',
  title: 'Итог · источник текстом и акцент на новых главах',
  description:
    'Над названием — метка папки, название источника и тип, без логотипа источника; справа остаётся 18+. Внизу — «Гл. 131 (+2) · дата»: только «(+2)» выделено цветом, без полужирного начертания. Без номера главы остаётся «+1 гл.», без даты её место не резервируется.',
  pros: [
    'В мета-строке остаётся один цветной значок — папка',
    'Источник назван текстом, а количество новых глав выделено коротким акцентом',
    'Сохраняет размеры карточки, обложки и привычный порядок строк',
  ],
  cons: [
    'Источник нельзя узнать по логотипу',
    'Скобки сами по себе не объясняют, что число означает новые главы',
  ],
};

export const META_VARIANTS: VariantDemo[] = [
  {
    id: CARD_VARIANT.COLORED_COUNT,
    metaVariant: META_VARIANT.CURRENT,
    code: 'M0',
    title: 'A9 · мета-строка как сейчас',
    description: 'Метка папки и логотип источника стоят рядом, затем название источника и тип.',
    pros: ['Сохраняет привычный порядок и оба значка'],
    cons: ['Два цветных значка подряд воспринимаются как одна группа'],
  },
  {
    id: CARD_VARIANT.COLORED_COUNT,
    metaVariant: META_VARIANT.SEPARATOR,
    code: 'M1',
    title: 'Разделитель после папки',
    description:
      'Папка отделена тонкой вертикальной линией с отступами. Логотип остаётся рядом с названием источника. Без папки линия исчезает.',
    pros: ['Явно разделяет папку и источник', 'Сохраняет оба значка на прежних местах'],
    cons: ['Линия и отступы отнимают место у текста на телефоне'],
  },
  {
    id: CARD_VARIANT.COLORED_COUNT,
    metaVariant: META_VARIANT.TEXT_SOURCE,
    code: 'M2',
    title: 'Источник только текстом',
    description:
      'Метка папки, название источника и тип. Логотип убран: в начале строки остаётся один цветной значок.',
    pros: ['Убирает соседство значков', 'Оставляет больше места названию источника'],
    cons: ['Источник нельзя узнать по логотипу'],
  },
  {
    id: CARD_VARIANT.COLORED_COUNT,
    metaVariant: META_VARIANT.FOLDER_RIGHT,
    code: 'M3',
    title: 'Папка справа',
    description:
      'Логотип, источник и тип остаются слева. Папка стоит у правого края мета-строки, перед меткой 18+, если она есть.',
    pros: ['Значки разнесены по краям строки', 'Логотип остаётся рядом с названием источника'],
    cons: ['Папку нужно искать на новом месте', 'На карточках 18+ справа стоят две метки'],
  },
];

export const VARIANTS: VariantDemo[] = [
  {
    id: CARD_VARIANT.COLORED_COUNT,
    code: 'A9',
    title: 'Акцент только на обновлениях',
    description:
      'Тот же A8: «Гл. 131 (+2) · дата», но только «(+2)» оранжевым. Номер главы и дата остаются серыми, начертание обычное.',
    pros: ['Количество новых глав заметнее, чем в A8', 'Акцент занимает только короткое «(+2)»'],
    cons: ['При быстром просмотре цвет без жирности может быть недостаточно заметен'],
  },
  {
    id: CARD_VARIANT.BOLD_COLORED_COUNT,
    code: 'A10',
    title: 'Цвет и полужирное начертание',
    description:
      'Как A9, но «(+2)» полужирным. Размер текста прежний; остальная мета остаётся серой, обычного начертания.',
    pros: [
      'Количество новых глав выделяется и цветом, и весом',
      'Сохраняет единую строку без плашек',
    ],
    cons: ['Контраст сильнее, чем у A9, и может снова перетягивать внимание'],
  },
  {
    id: CARD_VARIANT.COMBINED_META,
    code: 'A8',
    title: 'Новые главы в общей мета-строке',
    description:
      '«Гл. 131 (+2) · дата»: количество новых глав стоит в скобках после последней главы. Вся строка оформлена как обычная мета, без отдельного счётчика.',
    pros: [
      'Номер главы и обновления читаются одной записью',
      'Счётчик не спорит с названием и остальной мета-информацией',
    ],
    cons: [
      'Скобки менее явно объясняют, что число означает новые главы',
      'Без номера последней главы остаётся короткое «+1 гл.»',
    ],
  },
  {
    id: CARD_VARIANT.CURRENT,
    code: 'A0',
    title: 'Как сейчас',
    description:
      'Настоящая карточка главной: обложка 84 px, источник над названием, сведения о новых главах у нижнего края.',
    pros: ['Совпадает с текущим интерфейсом', 'Счётчик сразу заметен'],
    cons: ['Полужирный оранжевый счётчик перетягивает внимание'],
  },
  {
    id: CARD_VARIANT.SOFT_ACCENT,
    code: 'A3',
    title: 'Спокойный акцент',
    description: 'Тот же оранжевый счётчик, но обычным начертанием. Размер и место не меняются.',
    pros: ['Убирает избыточную жирность', 'Сохраняет привычный цвет обновлений'],
    cons: ['Оранжевый текст всё ещё заметнее соседних сведений'],
  },
  {
    id: CARD_VARIANT.DIMMED,
    code: 'A4',
    title: 'Приглушённый текст',
    description: 'Счётчик серый, обычного начертания, в прежнем размере и на прежнем месте.',
    pros: ['Не спорит с названием', 'Цвет совпадает с номером главы и датой'],
    cons: ['Число новых глав меньше выделяется при быстром просмотре'],
  },
  {
    id: CARD_VARIANT.BADGE,
    code: 'A5',
    title: 'Серый бейдж',
    description:
      '«+2 гл.» в прямоугольном бейдже muted: тонкая рамка и нейтральная подложка, как у остальных меток приложения.',
    pros: ['Счётчик отделён от даты без яркого текста', 'Использует привычное оформление меток'],
    cons: ['Добавляет ещё одну рамку внутри карточки', 'Шире текстового счётчика'],
  },
  {
    id: CARD_VARIANT.ICON_BADGE,
    code: 'A6',
    title: 'Плашка с иконкой глав',
    description:
      'Округлая плашка muted с иконкой открытой книги и «+2 гл.». Цвет акцентный, но без жирного текста.',
    pros: ['Иконка помогает отличить счётчик от номера главы', 'Повторяет стиль цветных меток'],
    cons: ['Самый широкий вариант', 'Иконка и цвет создают больше акцента, чем A5'],
  },
  {
    id: CARD_VARIANT.NUMBER_BADGE,
    code: 'A7',
    title: 'Число в отдельной рамке',
    description:
      'В маленьком сером бейдже только «+2», а «гл.» остаётся рядом. Дата и последняя глава идут дальше в прежнем порядке.',
    pros: ['Выделяет само число, а не всю надпись', 'Меньше подложки, чем у A5 и A6'],
    cons: ['Счётчик визуально разбит на две части'],
  },
];

export const PREVIOUS_VARIANTS: VariantDemo[] = [
  {
    id: CARD_VARIANT.COMPACT,
    code: 'A1',
    title: 'Плотнее, с привычным порядком',
    description:
      'Обложка 64 px, отступы 8 px, строки собраны рядом. Папка, источник и тип остаются над названием, сведения о главах — под ним.',
    pros: ['Сохраняет привычный порядок информации', 'Больше обновлений помещается на экране'],
    cons: ['Обложку сложнее рассмотреть', 'Источник по-прежнему встречается раньше названия'],
  },
  {
    id: CARD_VARIANT.TITLE_FIRST,
    code: 'A2',
    title: 'Название первым',
    description:
      'Та же плотность, что у A1. Название поднимается наверх, папка, источник и тип идут второй строкой, сведения о главах — третьей.',
    pros: [
      'Название сразу видно при просмотре списка',
      'Все сведения остаются рядом без пустого промежутка',
    ],
    cons: ['Порядок отличается от остальных карточек', 'Метка 18+ оставляет меньше места названию'],
  },
];
