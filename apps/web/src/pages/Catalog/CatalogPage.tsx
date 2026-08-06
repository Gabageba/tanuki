import { useEffect } from 'react';
import { Container, Group, Loader, SimpleGrid, Title } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useParams } from 'react-router';
import MangaCard from '@/entities/manga/MangaCard';
import useCatalog from '@/shared/api/hooks/useCatalog';
import { ApiRequestError } from '@/shared/api/client';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import RefreshCatalogButton from './RefreshCatalogButton';
import usePullToRefresh from './hooks/usePullToRefresh';

function CatalogPage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    isFetching,
    refresh,
  } = useCatalog(sourceId ?? '');
  const { ref, entry } = useIntersection({ threshold: 0 });
  const { pullDistance, isRefreshing: isPullRefreshing } = usePullToRefresh(refresh);

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.isIntersecting]);

  const errorMessage =
    error instanceof ApiRequestError ? error.message : 'Источник недоступен. Попробуйте позже.';

  useEffect(() => {
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Не удалось загрузить каталог',
        message: errorMessage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Container py="xl">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isPullRefreshing} />

      <Group justify="space-between" mb="md">
        <Title order={1}>{sourceId}</Title>
        {sourceId && (
          <RefreshCatalogButton
            key={sourceId}
            sourceId={sourceId}
            isRefreshing={isFetching && !isFetchingNextPage}
            onRefresh={refresh}
          />
        )}
      </Group>

      {isLoading && <Loader />}
      {isError && <ApiErrorText error={error} fallback={errorMessage} />}

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

export default CatalogPage;
