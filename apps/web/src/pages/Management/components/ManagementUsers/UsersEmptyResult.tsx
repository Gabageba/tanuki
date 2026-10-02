import { Button, EmptyState } from '@mantine/core';
import { FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onReset: () => void;
};

function UsersEmptyResult({ onReset }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('nobodyFound')}
      description={t('tryOtherNameOrResetFilters')}
      icon={<MagnifyingGlassIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
          {t('resetFilters')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default UsersEmptyResult;
