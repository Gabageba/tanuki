import { Anchor, Button, EmptyState } from '@mantine/core';
import { BookmarkSimpleIcon, CompassIcon } from '@phosphor-icons/react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  onImport: () => void;
};

/**
 * Ни одной закладки ещё нет — ни в одной папке. Кнопка одна — каталог; кто уже читает на другом
 * сайте, импортирует закладки ссылкой в конце описания.
 */
function BookmarksEmpty({ onImport }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('yourBookmarksWillBeHere')}
      description={
        <Trans
          i18nKey="addTitleWithToBookmarksOrImport"
          components={{ link: <Anchor component="button" inherit onClick={onImport} /> }}
        />
      }
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
