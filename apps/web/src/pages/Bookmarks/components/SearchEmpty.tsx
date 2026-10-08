import { Button, EmptyState } from '@mantine/core';
import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onReset: () => void;
};

/** Поиск по названию в папке ничего не нашёл. */
function SearchEmpty({ onReset }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('nothingFound')}
      description={t('noTitlesWithThisNameInFolder')}
      icon={<MagnifyingGlassIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<ArrowCounterClockwiseIcon />} onClick={onReset}>
          {t('reset')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SearchEmpty;
