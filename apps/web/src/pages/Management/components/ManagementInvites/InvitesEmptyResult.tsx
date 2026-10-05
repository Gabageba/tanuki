import { Button, EmptyState } from '@mantine/core';
import { FunnelIcon, FunnelXIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onReset: () => void;
};

/** Приглашения есть, но под фильтры ни одно не подошло. */
function InvitesEmptyResult({ onReset }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('nothingFound')}
      description={t('noInviteMatchesFilters')}
      icon={<FunnelIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
          {t('resetFilters')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default InvitesEmptyResult;
