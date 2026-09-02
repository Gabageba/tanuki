import { Center, Loader } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import useQuery from '../hooks/useQuery';
import type { PageLayoutPaginatedQuery } from '../models';

function InfiniteScrollTrigger() {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = useQuery<PageLayoutPaginatedQuery>();
  const [hasScrolled, setHasScrolled] = useState(false);
  // До первого скролла rootMargin нулевой — догружаем ровно столько страниц, сколько нужно,
  // чтобы заполнить экран, и ни одной лишней (на высоких экранах любой запас уже приводил
  // к догрузке второй страницы на первом рендере, до какого-либо взаимодействия). После первого
  // скролла переключаемся на запас вперёд, чтобы следующая страница успела прийти до того,
  // как пользователь долистает до конца текущей.
  const { ref, entry } = useIntersection({
    threshold: 0,
    rootMargin: hasScrolled ? '600px' : '0px',
  });

  useEffect(() => {
    if (hasScrolled) {
      return;
    }
    const handleScroll = () => setHasScrolled(true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.isIntersecting]);

  return (
    <>
      <div ref={ref} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Center>
          <Loader mt="md" />
        </Center>
      )}
    </>
  );
}

export default InfiniteScrollTrigger;
