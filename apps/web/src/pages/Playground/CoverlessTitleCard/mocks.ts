import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  SOURCE_ID,
} from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { makeSource, makeTitle } from '../TitleSearch/mocks';
import { EXAMPLE_SET, type Example, type ExampleSet } from './models';

export const SOURCE = {
  ...makeSource(SOURCE_ID.NUDEMOON, 'Nude-Moon', 'g.nude-moon.fun', 0),
  isAdult: true,
};
const READING_FOLDER: ResolvedBookmarkFolder = {
  id: 'coverless-reading',
  builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
  name: 'Читаю',
  icon: BOOKMARK_FOLDER_ICON.BOOK_OPEN,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  trackUpdates: true,
  count: 12,
  newCount: 0,
};
const LONG_FOLDER: ResolvedBookmarkFolder = {
  ...READING_FOLDER,
  id: 'coverless-custom',
  builtIn: null,
  name: 'Перечитать долгими зимними вечерами',
  icon: BOOKMARK_FOLDER_ICON.MOON,
  color: BOOKMARK_FOLDER_COLOR.VIOLET,
};
const DESCRIPTION =
  'В старой городской библиотеке находят письма, которые никто не отправлял. Новая хранительница пытается вернуть их адресатам и постепенно узнаёт историю исчезнувшего квартала. Каждое письмо приводит к новой встрече, а прошлое города оказывается тесно связано с её семьёй. Чтобы закончить поиски до закрытия библиотеки, ей придётся довериться незнакомому архивисту и снова открыть давно забытую читальную комнату.';
const TAGS = [
  'Повседневность',
  'Романтика',
  'Приключения',
  'Фэнтези',
  'Драма',
  'Детектив',
  'Историческое',
  'Комедия',
].map((title, index) => ({ id: `coverless-tag-${index}`, title }));

const createExample = (
  name: string,
  index: number,
  folder: ResolvedBookmarkFolder | null,
): Example => ({
  title: {
    ...makeTitle(SOURCE, index, {
      name,
      type: null,
      state: null,
      year: null,
      chapters: null,
      rating: null,
    }),
    coverUrl: '',
    description: DESCRIPTION,
    contentRating: CONTENT_RATING.ADULT,
    tags: TAGS.slice(0, 5),
    likes: 1284 - index * 83,
    views: 45000 + (index % 3) * 900,
  },
  folder,
});

export const EXAMPLES: Example[] = [
  createExample('Письма из старой библиотеки', 0, READING_FOLDER),
  createExample('Последний трамвай до моря', 1, null),
  createExample(
    'Однажды я вернулась в город, где никто не помнит моего имени, но все знают историю нашей последней встречи',
    2,
    LONG_FOLDER,
  ),
];
export const EDGE_EXAMPLES: Example[] = [
  { ...EXAMPLES[2]!, title: { ...EXAMPLES[2]!.title, tags: TAGS, likes: 123456 } },
  {
    ...EXAMPLES[0]!,
    folder: null,
    title: {
      ...EXAMPLES[0]!.title,
      id: 'nudemoon:coverless-zero',
      name: 'Первый снег',
      likes: 0,
      description: null,
      tags: [],
    },
  },
  {
    ...EXAMPLES[1]!,
    title: {
      ...EXAMPLES[1]!.title,
      id: 'nudemoon:coverless-empty',
      name: 'Тихая улица',
      description: null,
      tags: [],
      likes: null,
      contentRating: CONTENT_RATING.SAFE,
    },
  },
  {
    ...EXAMPLES[0]!,
    title: {
      ...EXAMPLES[0]!.title,
      id: 'nudemoon:coverless-longword',
      name: 'Сверхдлинноеназваниебезпробеловдляпроверкипереполнениянаузкомэкране',
      tags: TAGS,
      likes: null,
    },
  },
];
export const MONTH_EXAMPLES = [
  ...EXAMPLES,
  ...[
    'Дом у озера',
    'Между двумя станциями',
    'Сад за высокой стеной',
    'Обещание на рассвете',
    'Когда закончится дождь',
    'Незнакомцы в читальном зале',
    'Лето на окраине',
    'Поезд на север',
    'Встреча через много лет',
  ].map((name, index) => createExample(name, index + 3, index % 3 === 0 ? READING_FOLDER : null)),
];
export const MONTHS = [
  { value: '2026-11', label: 'Ноябрь 2026' },
  { value: '2026-10', label: 'Октябрь 2026' },
  { value: '2026-09', label: 'Сентябрь 2026' },
];

export const getExamples = (exampleSet: ExampleSet) => {
  switch (exampleSet) {
    case EXAMPLE_SET.REGULAR:
      return EXAMPLES;
    case EXAMPLE_SET.EDGE:
      return EDGE_EXAMPLES;
    case EXAMPLE_SET.SINGLE:
      return EXAMPLES.slice(0, 1);
  }
};
