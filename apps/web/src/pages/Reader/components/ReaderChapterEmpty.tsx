import { Box, EmptyState } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon } from '@phosphor-icons/react';

function ReaderChapterEmpty() {
  const { t } = useTranslation();
  return (
    <Box bg="var(--mantine-color-body)">
      <EmptyState
        title={t('pagesNotFound')}
        description={t('sourceReturnedNoPages')}
        icon={<BookOpenIcon />}
      />
    </Box>
  );
}

export default ReaderChapterEmpty;
