import { EmptyState } from '@mantine/core';
import { FolderSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Закладки есть, но в этой папке — ни одной. */
function FolderEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('folderIsEmptyYet')}
      description={t('chooseFolderInToBookmarks')}
      icon={<FolderSimpleIcon />}
    />
  );
}

export default FolderEmpty;
