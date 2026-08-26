import { SimpleGrid } from '@mantine/core';
import MangaCard from '@/entities/manga/MangaCard';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogQuery } from '../../models';
import CatalogSettings from './CatalogSettings';

type Props = {
  sourceId: string | undefined;
};

function CatalogContent({ sourceId }: Props) {
  const { data, isFetching, isFetchingNextPage } = PageLayout.useQuery<CatalogQuery>();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageLayout.Content showLoading={false}>
      <CatalogSettings sourceId={sourceId} />
      {isFetching && !isFetchingNextPage ? (
        'loading'
      ) : (
        <SimpleGrid cols={{ base: 2, xxs: 3, xs: 4, sm: 5, md: 6, lg: 7 }} spacing="md">
          {items.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </SimpleGrid>
      )}

      <PageLayout.InfiniteScrollTrigger />
    </PageLayout.Content>
  );
}

export default CatalogContent;
