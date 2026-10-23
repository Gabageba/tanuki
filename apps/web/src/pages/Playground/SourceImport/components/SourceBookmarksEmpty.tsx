import { Button, EmptyState } from '@mantine/core';
import { ArrowLeftIcon, BookmarkSimpleIcon } from '@phosphor-icons/react';
import { SOURCE_TITLE } from '../models';

/** На сайте закладок нет — вместо списка. */
function SourceBookmarksEmpty() {
  return (
    <EmptyState
      title={`На ${SOURCE_TITLE} закладок нет`}
      description="Добавьте тайтлы в закладки на сайте или выберите другой источник."
      icon={<BookmarkSimpleIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<ArrowLeftIcon />}>
          Выбрать другой источник
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SourceBookmarksEmpty;
