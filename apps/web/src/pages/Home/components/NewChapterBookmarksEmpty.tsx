import { EmptyState } from '@mantine/core';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Ни в одной отслеживаемой папке не вышло глав — блок остаётся, с пояснением, что сюда попадёт. */
function NewChapterBookmarksEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<BookmarkSimpleIcon />}
      title={t('noNewChapters')}
      description={t('newChaptersInTrackedFoldersAppearHere')}
    />
  );
}

export default NewChapterBookmarksEmpty;
