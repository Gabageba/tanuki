import { useTranslation } from 'react-i18next';
import { ProhibitIcon } from '@phosphor-icons/react';
import type { BackupRestoreResult } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import BackupPartRows from './BackupPartRows';

type Props = {
  result: BackupRestoreResult;
};

/** «Что изменилось» — те же строки, что у сводки, в прошедшем времени; пропущенное — своей
 *  строкой. */
function BackupResultRows({ result }: Props) {
  const { t, i18n } = useTranslation();
  const { skipped } = result;
  const skippedParts = [
    skipped.bookmarks > 0 && t('countBookmarks', { count: skipped.bookmarks }),
    skipped.progress > 0 && t('countMarks', { count: skipped.progress }),
    skipped.chapterReads > 0 && t('countChapters', { count: skipped.chapterReads }),
  ].filter((part) => part !== false);

  return (
    <BackupPartRows
      label={t('whatChanged')}
      bookmarks={{
        added: result.bookmarksAdded,
        details: [
          result.bookmarksMoved > 0 &&
            t('countMovedToBackupFolders', { count: result.bookmarksMoved }),
          result.titlesToPlanned > 0 &&
            t('countInPlannedFoldersDidntFit', { count: result.titlesToPlanned }),
        ],
      }}
      folders={{
        added: result.foldersCreated,
        details: [
          result.foldersOverLimit > 0 &&
            t('countDidntFitLimit', { count: result.foldersOverLimit }),
        ],
      }}
      progress={{
        added: result.progressAdded,
        details: [
          result.progressUpdated > 0 && t('countUpdated', { count: result.progressUpdated }),
        ],
      }}
      chapterReads={{ added: result.chapterReadsAdded, details: [] }}
      settings={result.settingsApplied ? t('appliedFromBackup') : t('unchanged')}
    >
      {skippedParts.length > 0 && (
        <GroupedList.Row
          icon={<ProhibitIcon />}
          title={t('skippedNoSourcesOnInstance')}
          // Перечень, а не фраза: каждая часть — свой ключ, склеивает их Intl по правилам языка.
          description={new Intl.ListFormat(i18n.language, { type: 'unit' }).format(skippedParts)}
        />
      )}
    </BackupPartRows>
  );
}

export default BackupResultRows;
