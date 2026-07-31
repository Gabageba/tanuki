import { useEffect } from 'react';
import { Container, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useParams } from 'react-router';
import { MangaCard } from '@/entities/manga';
import { useCatalog } from '@/shared/api/catalog';

export default function CatalogPage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useCatalog(
    sourceId ?? '',
  );
  const { ref, entry } = useIntersection({ threshold: 0 });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Container py="xl">
      <Title order={1} mb="md">
        {sourceId}
      </Title>

      {isLoading && <Loader />}
      {isError && <Text c="red">Источник недоступен. Попробуйте позже.</Text>}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
        {items.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </SimpleGrid>

      <div ref={ref} style={{ height: 1 }} />
      {isFetchingNextPage && <Loader mt="md" />}
    </Container>
  );
}
