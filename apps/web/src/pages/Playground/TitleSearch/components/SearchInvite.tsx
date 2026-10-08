import type { ReactNode } from 'react';
import { EmptyState } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';

type Props = {
  children?: ReactNode;
};

/** Пустая `/search` без истории: приглашение искать. */
function SearchInvite({ children }: Props) {
  return (
    <EmptyState
      title="Ищите по названию"
      description="Наберите название в строке поиска — поищем на всех включённых источниках"
      icon={<MagnifyingGlassIcon />}
    >
      {children}
    </EmptyState>
  );
}

export default SearchInvite;
