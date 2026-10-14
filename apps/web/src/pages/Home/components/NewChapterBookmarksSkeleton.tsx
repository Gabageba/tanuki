import { SimpleGrid } from '@mantine/core';
import NewChapterRowSkeleton from './NewChapterRowSkeleton';

/** Строк в скелетоне — три ряда по две колонки. */
const ROWS_COUNT = 6;

function NewChapterBookmarksSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="xs">
      {Array.from({ length: ROWS_COUNT }).map((_, index) => (
        <NewChapterRowSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export default NewChapterBookmarksSkeleton;
