import { Button, EmptyState } from '@mantine/core';
import { BookmarkSimpleIcon, CompassIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** Ни одной закладки ещё нет — ни в одной папке. */
function BookmarksEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('yourBookmarksWillBeHere')}
      description={t('addTitleWithToBookmarks')}
      icon={<BookmarkSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button
          component={Link}
          to={ROUTE_PATHS.SOURCES}
          variant="default"
          leftSection={<CompassIcon />}
        >
          {t('openCatalog')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default BookmarksEmpty;
