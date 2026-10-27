import type { TFunction } from 'i18next';
import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  SOURCE_IMPORT_FOLDER_TARGET,
  type Source,
  type SourceImportFolder,
  type SourceImportPreview,
} from '@tanuki/contracts';
import {
  getBuiltInBookmarkFolderColor,
  getBuiltInBookmarkFolderIcon,
  getBuiltInBookmarkFolderLabel,
} from '@/entities/bookmark/lib';

/** Импортировать можно оттуда, где выполнен вход и парсер умеет читать закладки. */
export const isImportableSource = (source: Source) =>
  source.isLoggedIn && source.isBookmarksImportSupported;

/**
 * Сети, откуда можно импортировать уже сейчас, — выше остальных, чтобы выбор не терялся под
 * сетями без входа. Внутри обеих частей — порядок каталога (сортировка устойчивая).
 */
export const sortImportableFamiliesFirst = <T extends { sources: Source[] }>(families: T[]) =>
  families.toSorted(
    (a, b) =>
      Number(b.sources.some(isImportableSource)) - Number(a.sources.some(isImportableSource)),
  );

/**
 * Папку без нового выбрать нельзя — забирать из неё нечего. Новое — и отметки «где остановился»:
 * повторный импорт папки, где всё уже лежит, переносит главы, до которых дочитали на сайте.
 */
export const isSelectableFolder = (folder: SourceImportFolder) =>
  folder.fresh > 0 || folder.progressDiffers > 0;

/** По умолчанию выбраны все папки, где есть новое. */
export const getDefaultFolderIds = (preview: SourceImportPreview) =>
  preview.folders.filter(isSelectableFolder).map(({ id }) => id);

/** Итог выбора: сколько папок и тайтлов ляжет и о скольких конфликтах будет вопрос. */
export const summarizeSelection = (preview: SourceImportPreview, folderIds: string[]) => {
  const selected = preview.folders.filter(
    (folder) => isSelectableFolder(folder) && folderIds.includes(folder.id),
  );
  const sum = (count: (folder: SourceImportFolder) => number) =>
    selected.reduce((total, folder) => total + count(folder), 0);
  return {
    folderCount: selected.length,
    titleCount: sum((folder) => folder.fresh),
    otherFolder: sum((folder) => folder.otherFolder),
    progressDiffers: sum((folder) => folder.progressDiffers),
  };
};

/** После папок — вопросы, если среди выбранного есть конфликты; иначе сразу импорт. */
export const hasQuestions = (summary: ReturnType<typeof summarizeSelection>) =>
  summary.otherFolder > 0 || summary.progressDiffers > 0;

/** «→ в „Читаю“» — куда папка сайта ляжет у вас. */
export const getFolderTargetText = (folder: SourceImportFolder, t: TFunction) => {
  const { builtIn, name } = folder.targetFolder;
  const targetName = builtIn ? getBuiltInBookmarkFolderLabel(builtIn, t) : (name ?? '');
  switch (folder.target) {
    case SOURCE_IMPORT_FOLDER_TARGET.BUILT_IN:
      return t('toFolderName', { name: targetName });
    case SOURCE_IMPORT_FOLDER_TARGET.MATCHED:
      return t('toYourFolderName', { name: targetName });
    case SOURCE_IMPORT_FOLDER_TARGET.CREATED:
      return t('sameFolderWillBeCreated');
    case SOURCE_IMPORT_FOLDER_TARGET.OVER_LIMIT:
      return t('toPlannedFoldersOverLimitNotCreated');
  }
};

/** Иконка и цвет нашей папки, куда ляжет папка сайта, — у встроенной их задаёт фронт. */
export const getTargetFolderGlyph = ({ targetFolder }: SourceImportFolder) =>
  targetFolder.builtIn
    ? {
        icon: getBuiltInBookmarkFolderIcon(targetFolder.builtIn),
        color: getBuiltInBookmarkFolderColor(targetFolder.builtIn),
      }
    : {
        icon: targetFolder.icon ?? BOOKMARK_FOLDER_ICON.BOOKMARK,
        color: targetFolder.color ?? BOOKMARK_FOLDER_COLOR.GRAY,
      };
