import { SimpleGrid } from '@mantine/core';
import MangaCard from '@/entities/manga/MangaCard';
import usePageLayoutQuery from '@/shared/ui/PageLayout/hooks/usePageLayoutQuery';
import type { CatalogQuery } from './models';

function CatalogGrid() {
  const { data } = usePageLayoutQuery<CatalogQuery>();
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SimpleGrid cols={{ base: 2, xxs: 3, xs: 4, sm: 5, md: 6, lg: 7 }} spacing="md">
      {items.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </SimpleGrid>
  );
}

export default CatalogGrid;
