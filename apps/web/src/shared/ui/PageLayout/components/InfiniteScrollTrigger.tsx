import { Loader } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect } from 'react';
import usePageLayoutQuery from '../hooks/usePageLayoutQuery';
import type { PageLayoutPaginatedQuery } from '../models';

function InfiniteScrollTrigger() {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePageLayoutQuery<PageLayoutPaginatedQuery>();
  // rootMargin запускает подгрузку заранее, пока сентинел ещё не виден — чтобы следующая
  // страница успела прийти до того, как пользователь долистает до конца текущей.
  const { ref, entry } = useIntersection({ threshold: 0, rootMargin: '600px' });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.isIntersecting]);

  return (
    <>
      <div ref={ref} style={{ height: 1 }} />
      {isFetchingNextPage && <Loader mt="md" />}
    </>
  );
}

export default InfiniteScrollTrigger;
