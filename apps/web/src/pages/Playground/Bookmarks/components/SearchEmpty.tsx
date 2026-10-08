import { Button, EmptyState } from '@mantine/core';
import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

/** Поиск по названию в папке ничего не нашёл. */
function SearchEmpty() {
  return (
    <EmptyState
      title="Ничего не найдено"
      description="В этой папке нет тайтлов с таким названием"
      icon={<MagnifyingGlassIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<ArrowCounterClockwiseIcon />}>
          Сбросить
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SearchEmpty;
