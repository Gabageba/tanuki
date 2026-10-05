import { Button, EmptyState } from '@mantine/core';
import { FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

type Props = {
  onReset: () => void;
};

function HealthEmptyResult({ onReset }: Props) {
  return (
    <EmptyState
      title="Ничего не найдено"
      description="Под выбранные фильтры не подходит ни один источник."
      icon={<MagnifyingGlassIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
          Сбросить фильтры
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default HealthEmptyResult;
