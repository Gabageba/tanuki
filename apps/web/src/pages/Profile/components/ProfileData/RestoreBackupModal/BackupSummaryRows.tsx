import { useTranslation } from 'react-i18next';
import type { BackupPreview } from '@tanuki/contracts';
import BackupPartRows from './BackupPartRows';
import { isAlreadyRestored } from './lib';

type Props = {
  preview: BackupPreview;
};

/** «Что в копии»: новых — справа, что уже есть и что пропущено — в описании. Всё уже есть —
 *  строк нет: показывать нечего, об этом говорит `NothingNewNote`. */
function BackupSummaryRows({ preview }: Props) {
  const { t } = useTranslation();
  const { bookmarks, folders, progress, chapterReads } = preview;

  if (isAlreadyRestored(preview)) {
    return null;
  }

  return (
    <BackupPartRows
      label={t('whatsInBackup')}
      bookmarks={{
        added: bookmarks.added,
        details: [
          bookmarks.sameFolder > 0 && t('countAlreadyInBookmarks', { count: bookmarks.sameFolder }),
          bookmarks.otherFolder > 0 && t('countInOtherFolder', { count: bookmarks.otherFolder }),
          bookmarks.skipped > 0 &&
            t('countSkippedNoSourcesOnInstance', { count: bookmarks.skipped }),
        ],
      }}
      folders={{
        added: folders.added,
        details: [
          folders.matched > 0 && t('countMatchedByName', { count: folders.matched }),
          folders.overLimit > 0 && t('countWontFitGoToPlanned', { count: folders.overLimit }),
        ],
      }}
      progress={{
        added: progress.added,
        details: [
          progress.differs > 0 && t('countDifferFromYours', { count: progress.differs }),
          progress.skipped > 0 && t('countSkippedNoSourcesOnInstance', { count: progress.skipped }),
        ],
      }}
      chapterReads={{
        added: chapterReads.added,
        details: [
          chapterReads.added > 0
            ? t('readChaptersAndReadingTime')
            : chapterReads.skipped === 0 && t('everythingAlreadyInStatistics'),
          chapterReads.skipped > 0 &&
            t('countSkippedNoSourcesOnInstance', { count: chapterReads.skipped }),
        ],
      }}
      settings={t('generalReaderSourcesIfEnabledBelow')}
    />
  );
}

export default BackupSummaryRows;
