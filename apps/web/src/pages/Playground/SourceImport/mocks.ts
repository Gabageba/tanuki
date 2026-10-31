import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  type BookmarkFolderColor,
} from '@tanuki/contracts';
import { getBuiltInTarget, getCreatedTarget } from './lib';
import {
  FOLDER_MAPPING,
  ITEM_STATE,
  type FolderMapping,
  type ImportItem,
  type SiteFolder,
  type TargetFolder,
} from './models';

const NAMES = [
  // Читаю — 24
  'История о том, как одна очень скромная девушка решила стать самым сильным магом королевства, но всё пошло не по плану',
  'Ван-Пис',
  'Магическая битва',
  'Человек-бензопила',
  'Берсерк',
  'Бродяга',
  'Дандадан',
  'Сакамото: дни на покое',
  'Кайдзю номер восемь',
  'Записки аптекарши',
  'Провожающая в последний путь Фрирен',
  'Подземелье вкусностей',
  'Ведьмина шляпа',
  'Синяя тюрьма: Блю Лок',
  'Гачиакута',
  'Поднятие уровня в одиночку',
  'Всеведущий читатель',
  'Начало после конца',
  'Возвращение мастера меча',
  'Башня Бога',
  'Семья шпиона',
  'Ориент',
  'Королевство',
  'Хантер × Хантер',
  // В планах — 46
  'Монстр',
  'Плутон',
  'Двадцатый век мальчиков',
  'Дорохедоро',
  'Сага о Винланде',
  'Земля драгоценностей',
  'Созданный в Бездне',
  'Девочка из Заграницы',
  'Удзумаки',
  'Акира',
  'Призрак в доспехах',
  'Навсикая из Долины ветров',
  'Ёцуба!',
  'Город, в котором меня нет',
  'Мой сосед Ямада',
  'Король шаманов',
  'Инуяся',
  'Ранма ½',
  'Песнь ночных сов',
  'Великий из бродячих псов',
  'Хоримия',
  'Кагуя: в любви как на войне',
  'Ваша апрельская ложь',
  'Форма голоса',
  'Синий оркестр',
  'Волейбол!!',
  'Баскетбол Куроко',
  'Слэм-данк',
  'Хадзимэ но Иппо',
  'Гинтама',
  'Клеймор',
  'Хеллсинг',
  'Тригун',
  'Гантц',
  'Бессмертный',
  'Пожарная бригада',
  'Чёрный клевер',
  'Ранкер, который живёт второй раз',
  'Да, я паук, и что с того?',
  'Re:Zero. Жизнь с нуля в альтернативном мире',
  'Повелитель',
  'О моём перерождении в слизь',
  'Ангел по соседству',
  'Сасаки и Мияно',
  'Вторая жизнь императрицы',
  'Злодейка, которая хочет жить',
  // Прочитано — 31
  'Атака титанов',
  'Тетрадь смерти',
  'Стальной алхимик',
  'Токийский гуль',
  'Моб Психо 100',
  'Ванпанчмен',
  'Наруто',
  'Блич',
  'Клинок, рассекающий демонов',
  'Обещанный Неверленд',
  'Доктор Стоун',
  'Токийские мстители',
  'Моя геройская академия',
  'Вайолет Эвергарден',
  'Тихий голос',
  'Ковбой Бибоп',
  'Под дубом',
  'Сломанная корона',
  'Я стал злодеем в романе',
  'Как приручить дракона наследнице',
  'Сто дней до свадьбы',
  'Дневник бывшей героини',
  'Перерождение в аристократке',
  'Тайная жизнь библиотекаря',
  'Чернильное сердце',
  'Последний рыцарь',
  'Песнь о ветре',
  'Магазин волшебных вещей',
  'Ледяной принц',
  'Звёздный странник',
  'Запретная библиотека',
  // Брошено — 9
  'Мастер меча онлайн',
  'Непобедимый воин',
  'Мастер муай-тай',
  'Девушка на час',
  'Сначала любовь, потом друзья',
  'Ночь в стране чудес',
  'Тетради дракона',
  'Холодный дом',
  'Крестовый поход',
  // Любимые — 11
  'Ходячий замок',
  'Ночная сова',
  'Солнечный свет',
  'Дом в небе',
  'Ад и рай',
  'Барракуда',
  'Вечерние сказки',
  'Охотник на демонов',
  'Домашняя проповедь',
  'Поцелуй сирены',
  'Прямой эфир',
  // Перечитать когда-нибудь летом — 3
  'Гибель',
  'Последний звонок',
  'Нечто',
];

const HUES: BookmarkFolderColor[] = Object.values(BOOKMARK_FOLDER_COLOR);

type ItemPatch = Partial<Omit<ImportItem, 'id' | 'name'>>;

/** Папка сайта из названий `NAMES[start…start+count)`: номер главы правдоподобный, у каждой пятой
 *  его нет; `patches` по индексу внутри папки задают состояние. */
const siteFolder = (
  id: string,
  name: string,
  mapping: FolderMapping,
  target: TargetFolder,
  [start, count]: [number, number],
  patches: Record<number, ItemPatch> = {},
): SiteFolder => ({
  id,
  name,
  mapping,
  target,
  items: Array.from({ length: count }, (_, index) => {
    const position = start + index;
    return {
      id: `title-${position}`,
      name: NAMES[position] ?? '',
      lastChapter: position % 5 === 3 ? null : ((position * 37) % 240) + 1,
      myChapter: null,
      state: ITEM_STATE.NEW,
      hue: HUES[position % HUES.length] ?? BOOKMARK_FOLDER_COLOR.GRAY,
      ...patches[index],
    };
  }),
});

const IN_GROUP: ItemPatch = { state: ITEM_STATE.IN_GROUP };
const IMPORTED: ItemPatch = { state: ITEM_STATE.IMPORTED };

/** Своя папка «Любимые» уже есть у пользователя — совпадёт по имени. */
const FAVORITES: TargetFolder = {
  name: 'Любимые',
  icon: BOOKMARK_FOLDER_ICON.HEART,
  color: BOOKMARK_FOLDER_COLOR.PINK,
};

const READING = siteFolder(
  'reading',
  'Читаю',
  FOLDER_MAPPING.BUILT_IN,
  getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.READING),
  [0, 24],
  {
    2: { state: ITEM_STATE.OTHER_FOLDER, currentFolder: BUILT_IN_BOOKMARK_FOLDER.PLANNED },
    4: { ...IN_GROUP, myChapter: 312 },
    5: { ...IN_GROUP, myChapter: 141 },
    9: { state: ITEM_STATE.OTHER_FOLDER, currentFolder: BUILT_IN_BOOKMARK_FOLDER.PLANNED },
    13: { ...IN_GROUP, myChapter: 230 },
    20: { ...IMPORTED, myChapter: 98 },
    22: IMPORTED,
  },
);
const PLANNED = siteFolder(
  'planned',
  'В планах',
  FOLDER_MAPPING.BUILT_IN,
  getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.PLANNED),
  [24, 46],
  {
    1: IN_GROUP,
    6: { state: ITEM_STATE.OTHER_FOLDER, currentFolder: BUILT_IN_BOOKMARK_FOLDER.READING },
    11: IN_GROUP,
    17: { state: ITEM_STATE.OTHER_FOLDER, currentFolder: BUILT_IN_BOOKMARK_FOLDER.COMPLETED },
    30: IMPORTED,
    31: IMPORTED,
    40: IMPORTED,
    44: IMPORTED,
  },
);
const COMPLETED = siteFolder(
  'completed',
  'Прочитано',
  FOLDER_MAPPING.BUILT_IN,
  getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.COMPLETED),
  [70, 31],
  {
    0: {
      state: ITEM_STATE.OTHER_FOLDER,
      currentFolder: BUILT_IN_BOOKMARK_FOLDER.READING,
      myChapter: 120,
    },
    3: { ...IN_GROUP, myChapter: 64 },
    8: IMPORTED,
    14: IMPORTED,
    15: IMPORTED,
  },
);
const DROPPED = siteFolder(
  'dropped',
  'Брошено',
  FOLDER_MAPPING.BUILT_IN,
  getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.DROPPED),
  [101, 9],
  {
    2: { state: ITEM_STATE.OTHER_FOLDER, currentFolder: BUILT_IN_BOOKMARK_FOLDER.READING },
    7: IMPORTED,
  },
);
const FAVORITE = siteFolder('favorites', 'Любимые', FOLDER_MAPPING.MATCHED, FAVORITES, [110, 11], {
  0: IN_GROUP,
  4: IMPORTED,
  9: IMPORTED,
});
const SUMMER = siteFolder(
  'summer',
  'Перечитать когда-нибудь летом, если будет время',
  FOLDER_MAPPING.CREATED,
  getCreatedTarget('Перечитать когда-нибудь летом, если будет время'),
  [121, 3],
);

/** Библиотека на MangaLib: 124 тайтла в шести папках, есть копии, конфликты и уже импортированное. */
export const LIBRARY: SiteFolder[] = [READING, PLANNED, COMPLETED, DROPPED, FAVORITE, SUMMER];

/** Повторный импорт: всё уже есть, нового нет. */
export const LIBRARY_NOTHING_NEW: SiteFolder[] = [READING, PLANNED, COMPLETED].map((item) => ({
  ...item,
  items: item.items.slice(0, 5).map((title) => ({ ...title, state: ITEM_STATE.IMPORTED })),
}));

/** Своих папок у пользователя почти лимит: две свои папки сайта не поместились. */
export const LIBRARY_OVER_LIMIT: SiteFolder[] = [
  { ...READING, items: READING.items.slice(1, 4) },
  {
    ...FAVORITE,
    items: FAVORITE.items.slice(0, 3),
  },
  {
    id: 'postponed',
    name: 'Отложено',
    mapping: FOLDER_MAPPING.OVER_LIMIT,
    target: getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.PLANNED),
    items: PLANNED.items.slice(0, 3),
  },
  {
    id: 'shonen',
    name: 'Сёнэн на вечер',
    mapping: FOLDER_MAPPING.OVER_LIMIT,
    target: getBuiltInTarget(BUILT_IN_BOOKMARK_FOLDER.PLANNED),
    items: COMPLETED.items.slice(1, 4),
  },
];

/** На сайте закладок нет. */
export const LIBRARY_EMPTY: SiteFolder[] = [];

const pick = (folder: SiteFolder, indexes: number[]) =>
  folder.items.filter((_, index) => indexes.includes(index));

/** Короткая выборка для осей строки (R, A, P, M): всё разнообразие строк — на первом экране. */
export const LIBRARY_PREVIEW: SiteFolder[] = [
  { ...READING, items: pick(READING, [0, 1, 2, 4, 5, 20, 22]) },
  { ...FAVORITE, items: pick(FAVORITE, [0, 1, 4]) },
  SUMMER,
];

const allImported = (folder: SiteFolder): SiteFolder => ({
  ...folder,
  items: folder.items.map((item) => ({ ...item, state: ITEM_STATE.IMPORTED })),
});

/** Шаг «Папки»: вся библиотека плюс две папки сверх лимита. */
export const LIBRARY_FOLDERS: SiteFolder[] = [...LIBRARY, ...LIBRARY_OVER_LIMIT.slice(2)];

/** Повторный импорт по папкам: в «Брошено» и «Любимых» нового нет. */
export const LIBRARY_FOLDERS_REPEAT: SiteFolder[] = LIBRARY.map((folder) =>
  folder === DROPPED || folder === FAVORITE ? allImported(folder) : folder,
);

/** Повторный импорт, где нового нет нигде. */
export const LIBRARY_FOLDERS_NOTHING_NEW: SiteFolder[] = LIBRARY.map(allImported);
