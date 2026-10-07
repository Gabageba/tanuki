import { Button, EmptyState } from '@mantine/core';
import { BookmarkSimpleIcon, CompassIcon } from '@phosphor-icons/react';

/** Ни одной закладки ещё нет. */
function BookmarksEmpty() {
  return (
    <EmptyState
      title="Здесь будут ваши закладки"
      description="Добавьте тайтл кнопкой «В закладки» на его странице или в читалке"
      icon={<BookmarkSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<CompassIcon />}>
          Открыть каталог
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default BookmarksEmpty;
