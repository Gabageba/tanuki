import { Box, Container, Flex, Group, Title } from '@mantine/core';
import { useContext, type ReactNode } from 'react';
import QueryError from '../../QueryError';
import GoBackButton from '../../GoBackButton';
import OfflineEmptyState from '../../OfflineEmptyState';
import useSkeletonTiming from '../../QueryBlock/hooks/useSkeletonTiming';
import { PageLayoutStatusContext } from '../context';
import type { PageLayoutBaseQuery } from '../models';
import type { LoadingQuery } from '../../QueryBlock/models';

type Props = {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  goBack?: boolean | { path: string };
  /** Содержимое скелетоном, пока ждём главный запрос страницы (или все именованные). Без него
   *  содержимое рисуется сразу, а загрузку блоки показывают сами (`QueryBlock`). */
  skeleton?: ReactNode;
  /** Пояснение «Нет сети», когда основной запрос без сети не нашёлся в кеше. */
  offlineDescription?: string;
  /** Standalone frames such as the reader supply their query directly. */
  query?: LoadingQuery;
  fluid?: boolean;
  offline?: ReactNode;
};

/** Страница без запроса: показывать нечего ждать. */
const NO_QUERY: PageLayoutBaseQuery = {
  data: null,
  isPending: false,
  isError: false,
  error: null,
  isPlaceholderData: false,
  fetchStatus: 'idle',
  refetch: () => undefined,
};

/** Каркас страницы: заголовок и содержимое. Когда показать `skeleton`, решает тот же механизм,
 *  что и у `QueryBlock`; без сети и без данных — «Нет соединения», упал без данных — экран ошибки. */
function Content({
  children,
  title,
  actions,
  goBack,
  skeleton,
  offlineDescription,
  query: ownQuery,
  fluid = false,
  offline,
}: Props) {
  const pageQuery = useContext(PageLayoutStatusContext);
  const query = ownQuery ?? pageQuery ?? NO_QUERY;
  const { ref, isSkeleton, isOffline, isFailed } = useSkeletonTiming<HTMLDivElement>(query);

  let content = children;
  if (isOffline) {
    content = offline ?? <OfflineEmptyState description={offlineDescription} />;
  } else if (isFailed && query.error) {
    // Упавший перезапрос при показанных данных их не прячет — о нём сообщит уведомление.
    content = <QueryError error={query.error} onRetry={query.refetch} />;
  } else if (isSkeleton && skeleton !== undefined) {
    content = skeleton;
  }

  return (
    <Container py={fluid ? 0 : 'md'} px={fluid ? 0 : undefined} size={fluid ? '100%' : 'xl'}>
      {(title || actions || !!goBack) && (
        <Flex
          justify={title ? 'space-between' : 'flex-end'}
          mb="md"
          gap="sm"
          direction={{ base: 'column', xs: 'row' }}
        >
          {(!!goBack || title) && (
            <Group gap="xs">
              {!!goBack && (
                <GoBackButton path={typeof goBack === 'object' ? goBack.path : undefined} />
              )}
              {title && <Title order={2}>{title}</Title>}
            </Group>
          )}
          {actions}
        </Flex>
      )}
      <Box
        // Без своего скелетона загрузку показывают блоки — прокручивать страницу незачем.
        ref={skeleton === undefined ? undefined : ref}
        style={{
          scrollMarginTop: 'calc(var(--app-shell-header-height) + var(--mantine-spacing-md))',
        }}
      >
        {content}
      </Box>
    </Container>
  );
}

export default Content;
