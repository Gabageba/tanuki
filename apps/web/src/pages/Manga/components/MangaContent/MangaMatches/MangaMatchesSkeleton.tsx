import { Skeleton, Stack } from '@mantine/core';

const PLACEHOLDER_ROWS = [1, 2, 3];

function MangaMatchesSkeleton() {
  return (
    <Stack gap={6}>
      {PLACEHOLDER_ROWS.map((row) => (
        <Skeleton key={row} h={58} radius="md" />
      ))}
    </Stack>
  );
}

export default MangaMatchesSkeleton;
