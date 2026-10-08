import { Button, EmptyState } from '@mantine/core';
import { FunnelIcon, FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

type Props = {
  withFilters?: boolean;
  onReset?: () => void;
};

/** Ни один источник ничего не нашёл; при выбранных фильтрах — «Сбросить фильтры». */
function NothingFound({ withFilters = false, onReset }: Props) {
  return (
    <EmptyState
      title="Ничего не найдено"
      description="Попробуйте другое написание или оригинальное название"
      icon={withFilters ? <FunnelIcon /> : <MagnifyingGlassIcon />}
    >
      {withFilters && (
        <EmptyState.Actions>
          <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
            Сбросить фильтры
          </Button>
        </EmptyState.Actions>
      )}
    </EmptyState>
  );
}

export default NothingFound;
