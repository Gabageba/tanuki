import { EmptyState } from '@mantine/core';
import { FolderSimpleIcon } from '@phosphor-icons/react';

/** Закладки есть, но в этой папке — ни одной. */
function FolderEmpty() {
  return (
    <EmptyState
      title="В этой папке пока пусто"
      description="Выберите её в «В закладки» на странице тайтла"
      icon={<FolderSimpleIcon />}
    />
  );
}

export default FolderEmpty;
