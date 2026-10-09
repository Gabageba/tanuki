import { useEffect } from 'react';
import { Box, Center, Loader } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';

type Props = {
  onLoadMore: () => void;
};

/** Задержка «ответа сервера» в макете. */
const FETCH_DELAY = 500;

/** Невидимая метка внизу ленты: когда до неё долистали, подгружается следующая страница — как
 *  `InfiniteScrollTrigger` в приложении, но без запроса. */
function FeedInfiniteTrigger({ onLoadMore }: Props) {
  const { ref, entry } = useIntersection({ threshold: 0, rootMargin: '300px' });
  const isIntersecting = entry?.isIntersecting ?? false;

  useEffect(() => {
    if (!isIntersecting) {
      return;
    }
    const timer = setTimeout(onLoadMore, FETCH_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersecting]);

  return (
    <>
      <Box ref={ref} h={1} />
      {isIntersecting && (
        <Center>
          <Loader size="sm" />
        </Center>
      )}
    </>
  );
}

export default FeedInfiniteTrigger;
