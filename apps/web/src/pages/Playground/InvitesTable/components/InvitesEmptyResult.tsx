import { Button, EmptyState } from '@mantine/core';
import { FunnelIcon, FunnelXIcon } from '@phosphor-icons/react';

type Props = {
  onReset: () => void;
};

/** Приглашения есть, но под фильтры ни одно не подошло. */
function InvitesEmptyResult({ onReset }: Props) {
  return (
    <EmptyState
      title="Ничего не найдено"
      description="Под эти фильтры не подошло ни одно приглашение"
      icon={<FunnelIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
          Сбросить фильтры
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default InvitesEmptyResult;
