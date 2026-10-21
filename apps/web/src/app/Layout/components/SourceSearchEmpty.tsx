import { Button, EmptyState } from '@mantine/core';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onReset: () => void;
};

/** Поиск по названию в списке источников ничего не нашёл. */
function SourceSearchEmpty({ onReset }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      size="sm"
      title={t('nothingFound')}
      description={t('noSourceWithThisName')}
      icon={<MagnifyingGlassIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<XIcon />} onClick={onReset}>
          {t('clearSearch')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SourceSearchEmpty;
