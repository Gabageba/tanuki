import { EmptyState } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/** Ничего не читали или всё убрали — блок остаётся, с пояснением, что сюда попадёт. */
function ContinueReadingEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<BookOpenIcon />}
      title={t('nothingToContinue')}
      description={t('titlesYouStartedReadingAppearHere')}
    />
  );
}

export default ContinueReadingEmpty;
