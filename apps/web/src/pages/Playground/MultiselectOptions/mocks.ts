import type { MockList, MockOption } from './models';

const CONTENT_TYPES: MockOption[] = [
  { value: 'mangaAndManhwa', label: 'Манга и манхва' },
  { value: 'hentai', label: 'Хентай' },
  { value: 'comics', label: 'Комиксы' },
  { value: 'other', label: 'Другое' },
];

const GENRES: MockOption[] = [
  { value: 'action', label: 'Боевик' },
  { value: 'comedy', label: 'Комедия' },
  { value: 'drama', label: 'Драма' },
  { value: 'romance', label: 'Романтика' },
  { value: 'fantasy', label: 'Фэнтези' },
  { value: 'horror', label: 'Ужасы' },
  { value: 'sliceOfLife', label: 'Повседневность' },
  { value: 'sports', label: 'Спорт' },
  { value: 'isekai', label: 'Исекай' },
];

const mark = (options: MockOption[], patch: Record<number, Partial<MockOption>>) =>
  options.map((option, index) => ({ ...option, ...patch[index] }));

/** Состояния для оси O: как выбранные стоят рядом друг с другом и с невыбранными. */
export const LOOK_LISTS: MockList[] = [
  {
    title: 'Все выбраны подряд',
    options: mark(CONTENT_TYPES, {
      0: { checked: true },
      1: { checked: true },
      2: { checked: true },
      3: { checked: true },
    }),
  },
  {
    title: 'Через один',
    options: mark(CONTENT_TYPES, { 0: { checked: true }, 2: { checked: true } }),
  },
  {
    title: 'Наведение рядом с выбранными',
    options: mark(CONTENT_TYPES, {
      0: { checked: true },
      1: { checked: true },
      2: { hovered: true },
    }),
  },
  {
    title: 'Длинный список',
    options: mark(GENRES, {
      1: { checked: true },
      2: { checked: true },
      3: { checked: true },
      5: { checked: true },
      7: { checked: true },
    }),
  },
];

/** Состояния для оси K: где стоит курсор клавиатуры. */
export const FOCUS_LISTS: MockList[] = [
  {
    title: 'Фокус на невыбранном',
    options: mark(CONTENT_TYPES, {
      0: { checked: true },
      1: { focused: true },
      2: { checked: true },
    }),
  },
  {
    title: 'Фокус на выбранном',
    options: mark(CONTENT_TYPES, {
      0: { checked: true },
      1: { checked: true, focused: true },
      2: { checked: true },
    }),
  },
  {
    title: 'Все выбраны, фокус в середине',
    options: mark(CONTENT_TYPES, {
      0: { checked: true },
      1: { checked: true },
      2: { checked: true, focused: true },
      3: { checked: true },
    }),
  },
];

/** Данные живых полей: поле с типами контента и длинное поле с жанрами. */
export const LIVE_CONTENT_TYPES = CONTENT_TYPES.map(({ value, label }) => ({ value, label }));
export const LIVE_GENRES = GENRES.map(({ value, label }) => ({ value, label }));
