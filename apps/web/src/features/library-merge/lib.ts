import type { TFunction } from 'i18next';
import { MERGE_ORIGIN, type MergeOrigin } from './models';

/** «Взять из копии» / «Взять из источника» — ответ про папки. */
export const getTakeFoldersLabel = (origin: MergeOrigin, t: TFunction) => {
  switch (origin) {
    case MERGE_ORIGIN.BACKUP:
      return t('takeFromBackup');
    case MERGE_ORIGIN.SOURCE:
      return t('takeFromSource');
  }
};

export const getTakeFoldersDescription = (origin: MergeOrigin, t: TFunction) => {
  switch (origin) {
    case MERGE_ORIGIN.BACKUP:
      return t('titlesMoveToBackupFolders');
    case MERGE_ORIGIN.SOURCE:
      return t('titlesMoveToFoldersAsOnSite');
  }
};

/** «Из копии» / «С источника» — ответ про отметки. */
export const getTakeProgressLabel = (origin: MergeOrigin, t: TFunction) => {
  switch (origin) {
    case MERGE_ORIGIN.BACKUP:
      return t('fromBackup');
    case MERGE_ORIGIN.SOURCE:
      return t('fromSource');
  }
};

export const getTakeProgressDescription = (origin: MergeOrigin, t: TFunction) => {
  switch (origin) {
    case MERGE_ORIGIN.BACKUP:
      return t('yourMarksReplacedFromBackup');
    case MERGE_ORIGIN.SOURCE:
      return t('yourMarksReplacedFromSite');
  }
};
