import { Paper, Stack } from '@mantine/core';
import type { MockBookmark } from '../models';
import BookmarksGroup from './BookmarksGroup';
import PhoneFrame from './PhoneFrame';

type Props = {
  bookmarks: MockBookmark[];
};

/** C8 — при сортировке «По обновлению» закладки с новыми главами идут отдельной группой сверху. */
function GroupedCardsDemo({ bookmarks }: Props) {
  const withNew = bookmarks.filter(({ newChaptersCount }) => newChaptersCount > 0);
  const rest = bookmarks.filter(({ newChaptersCount }) => newChaptersCount === 0);

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Stack gap="lg" maw={960}>
          <BookmarksGroup
            title="Вышли новые главы"
            bookmarks={withNew}
            cols={{ base: 2, sm: 3, lg: 5 }}
          />
          <BookmarksGroup title="Остальные" bookmarks={rest} cols={{ base: 2, sm: 3, lg: 5 }} />
        </Stack>
      </Paper>
      <PhoneFrame>
        <Stack gap="lg">
          <BookmarksGroup title="Вышли новые главы" bookmarks={withNew.slice(0, 2)} cols={2} />
          <BookmarksGroup title="Остальные" bookmarks={rest.slice(0, 2)} cols={2} />
        </Stack>
      </PhoneFrame>
    </Stack>
  );
}

export default GroupedCardsDemo;
