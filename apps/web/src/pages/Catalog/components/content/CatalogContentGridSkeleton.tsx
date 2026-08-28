import { SimpleGrid } from '@mantine/core';
import MangaCardSkeleton from '@/entities/manga/MangaCardSkeleton';

function CatalogContentGridSkeleton() {
  return (
    <SimpleGrid cols={{ base: 2, xxs: 3, xs: 4, sm: 5, md: 6, lg: 7 }} spacing="md">
      {Array.from({ length: 21 }).map((_, index) => (
        <MangaCardSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export default CatalogContentGridSkeleton;
