import { Button, EmptyState } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';

type Props = {
  sourceTitle: string;
  onBack: () => void;
};

/** На сайте закладок нет — вместо списка папок. */
function SourceBookmarksEmpty({ sourceTitle, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('noBookmarksOnSource', { source: sourceTitle })}
      description={t('addBookmarksOnSiteOrChooseAnotherSource')}
      icon={<BookmarkSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<ArrowLeftIcon />} onClick={onBack}>
          {t('chooseAnotherSource')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SourceBookmarksEmpty;
