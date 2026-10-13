import { Button, Center, Loader, Stack, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLayoutQueryContext } from '../context';
import type { PageLayoutPaginatedQuery } from '../models';

type Props = {
  /** Запрос списка, если он не главный запрос страницы (`PageLayout useQuery`) — например, у
   *  открытой вкладки подборок. */
  query?: PageLayoutPaginatedQuery;
};

/**
 * Подгрузка следующей страницы списка, когда низ списка показался на экране. Не загрузилась —
 * на месте подгрузки причина и «Повторить загрузку списка» (F1): сама по прокрутке она не
 * повторяется, чтобы не долбить упавший источник.
 */
function InfiniteScrollTrigger({ query: ownQuery }: Props) {
  const { t } = useTranslation();
  const pageQuery = useContext(PageLayoutQueryContext) as PageLayoutPaginatedQuery | null;
  const query = ownQuery ?? pageQuery;
  if (!query) {
    throw new Error(
      'PageLayout.InfiniteScrollTrigger needs a query: a prop or PageLayout useQuery',
    );
  }
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;
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
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  if (isFetchNextPageError && !isFetchingNextPage) {
    return (
      <Stack gap="xs" align="center" mt="md">
        <Text fz="sm" c="dimmed" ta="center">
          {t('failedToLoadListContinuation')}
        </Text>
        <Button variant="default" leftSection={<ArrowClockwiseIcon />} onClick={fetchNextPage}>
          {t('retryListLoading')}
        </Button>
      </Stack>
    );
  }

  return (
    <>
      {/* Метка пересоздаётся на начале и конце каждой подгрузки — новый observer сразу сообщает
          свежее пересечение. Иначе при быстрой прокрутке метка въезжает в зону, пока идёт
          подгрузка, и остаётся в ней, когда порция пришла: `isIntersecting` не меняется,
          и следующая порция не запрашивается, пока не уйти вверх и не вернуться. */}
      <div key={String(isFetchingNextPage)} ref={ref} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Center>
          <Loader mt="md" />
        </Center>
      )}
    </>
  );
}

export default InfiniteScrollTrigger;
