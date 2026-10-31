import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  type BuiltInBookmarkFolder,
} from '@tanuki/contracts';
import {
  getBuiltInBookmarkFolderColor,
  getBuiltInBookmarkFolderIcon,
} from '@/entities/bookmark/lib';
import {
  FOLDER_MAPPING,
  ITEM_STATE,
  type FolderMapping,
  type ImportItem,
  type SiteFolder,
  type TargetFolder,
} from './models';

/** Подписи встроенных папок литералами — песочница не ходит в i18n. */
export const getBuiltInLabel = (folder: BuiltInBookmarkFolder) => {
  switch (folder) {
    case BUILT_IN_BOOKMARK_FOLDER.READING:
      return 'Читаю';
    case BUILT_IN_BOOKMARK_FOLDER.PLANNED:
      return 'В планах';
    case BUILT_IN_BOOKMARK_FOLDER.ON_HOLD:
      return 'Отложено';
    case BUILT_IN_BOOKMARK_FOLDER.COMPLETED:
      return 'Прочитано';
    case BUILT_IN_BOOKMARK_FOLDER.DROPPED:
      return 'Брошено';
    case BUILT_IN_BOOKMARK_FOLDER.FAVORITE:
      return 'Любимое';
  }
};

export const getBuiltInTarget = (folder: BuiltInBookmarkFolder): TargetFolder => ({
  name: getBuiltInLabel(folder),
  icon: getBuiltInBookmarkFolderIcon(folder),
  color: getBuiltInBookmarkFolderColor(folder),
});

/** Папка, которую импорт создаст: иконка `bookmark`, цвет `gray` — по правилам копии. */
export const getCreatedTarget = (name: string): TargetFolder => ({
  name,
  icon: BOOKMARK_FOLDER_ICON.BOOKMARK,
  color: BOOKMARK_FOLDER_COLOR.GRAY,
});

/** «→ …» в шапке группы и в сводке папок (M2, M3). */
export const getMappingText = (folder: SiteFolder) => {
  switch (folder.mapping) {
    case FOLDER_MAPPING.BUILT_IN:
      return `в «${folder.target.name}»`;
    case FOLDER_MAPPING.MATCHED:
      return `в вашу папку «${folder.target.name}»`;
    case FOLDER_MAPPING.CREATED:
      return 'создастся такая же папка';
    case FOLDER_MAPPING.OVER_LIMIT:
      return 'в «В планах»: папки сверх лимита не создаются';
  }
};

/** Подпись под названием — что будет с тайтлом, если у вас он уже есть. */
export const getItemNote = (item: ImportItem) => {
  switch (item.state) {
    case ITEM_STATE.NEW:
      return null;
    case ITEM_STATE.IN_GROUP:
      return 'Уже в закладках — добавится как ещё один источник';
    case ITEM_STATE.OTHER_FOLDER:
      return `Уже в закладках, в «${item.currentFolder ? getBuiltInLabel(item.currentFolder) : ''}»`;
    case ITEM_STATE.IMPORTED:
      return 'Уже в закладках';
  }
};

export const isImported = (item: ImportItem) => item.state === ITEM_STATE.IMPORTED;

/** Отметка расходится с вашей — из-за таких строк появляется вопрос «Где остановился». */
export const hasProgressDiff = (item: ImportItem) =>
  item.lastChapter !== null && item.myChapter !== null && item.lastChapter !== item.myChapter;

/** Выбрано по умолчанию: всё, кроме уже импортированного. */
export const getDefaultSelection = (folders: SiteFolder[]) =>
  folders.flatMap((folder) => folder.items.filter((item) => !isImported(item)).map(({ id }) => id));

export const countItems = (folders: SiteFolder[]) =>
  folders.reduce((total, folder) => total + folder.items.length, 0);

/** Уже импортированные — в конце группы (A1, A2); в A3 порядок сайта не трогаем. */
export const splitImported = (items: ImportItem[]) => ({
  fresh: items.filter((item) => !isImported(item)),
  imported: items.filter(isImported),
});

/** Русское склонение по числу: 1 папка, 2 папки, 5 папок. */
export const pluralize = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export const getTitlesCountText = (count: number) =>
  `${count} ${pluralize(count, 'тайтл', 'тайтла', 'тайтлов')}`;

/** Сколько в папке сайта нового — уже импортированное при повторном импорте пропускается. */
export const countFresh = (folder: SiteFolder) =>
  folder.items.filter((item) => !isImported(item)).length;

/** «24 тайтла», «9 новых из 24» или «Нового нет». */
export const getFreshText = (folder: SiteFolder) => {
  const fresh = countFresh(folder);
  const total = folder.items.length;
  if (fresh === 0) return 'Нового нет';
  if (fresh === total) return getTitlesCountText(total);
  return `${fresh} ${pluralize(fresh, 'новый', 'новых', 'новых')} из ${total}`;
};

/** Среди нового в папке есть конфликт — тогда после выбора папок будет шаг «Вопросы». */
export const hasFolderConflicts = (folder: SiteFolder) =>
  folder.items.some(
    (item) =>
      !isImported(item) && (item.state === ITEM_STATE.OTHER_FOLDER || hasProgressDiff(item)),
  );

/** Подзаголовок блока в F3 — что будет с папками сайта этого блока. */
export const getMappingGroupTitle = (mapping: FolderMapping) => {
  switch (mapping) {
    case FOLDER_MAPPING.BUILT_IN:
      return 'Во встроенные папки';
    case FOLDER_MAPPING.MATCHED:
      return 'В ваши папки';
    case FOLDER_MAPPING.CREATED:
      return 'Создадутся';
    case FOLDER_MAPPING.OVER_LIMIT:
      return 'Не поместятся — в «В планах»';
  }
};
