import { Skeleton, Stack } from '@mantine/core';

function BookmarkFolderOptionsSkeleton() {
  return (
    <Stack gap="xs">
      <Skeleton h={64} radius="md" />
      <Skeleton h={64} radius="md" />
    </Stack>
  );
}

export default BookmarkFolderOptionsSkeleton;
