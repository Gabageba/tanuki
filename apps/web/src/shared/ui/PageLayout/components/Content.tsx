import { Container, Flex, Group, Title } from '@mantine/core';
import { useContext, useMemo, type ReactNode } from 'react';
import BlockLoader from '../../BlockLoader';
import QueryError from '../../QueryError';
import GoBackButton from '../../GoBackButton';
import { PageLayoutQueryContext } from '../context';

type Props = {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  showLoading?: boolean;
  goBack?: boolean | { path: string };
  /** Пояснение «Нет сети», когда основной запрос без сети не нашёлся в кеше. */
  offlineDescription?: string;
};

function Content({
  children,
  title,
  actions,
  showLoading = true,
  goBack,
  offlineDescription,
}: Props) {
  // Запрос у PageLayout необязателен — без него контент просто рендерится сразу.
  const query = useContext(PageLayoutQueryContext);
  const isPending = query?.isPending ?? false;
  // Упавший фоновый refetch не прячет уже загруженный контент — о нём сообщит уведомление.
  const error = query?.isError && query.data === undefined ? query.error : null;
  const refetch = query?.refetch;

  const renderContent = useMemo(() => {
    if (isPending && showLoading) {
      return <BlockLoader />;
    }

    if (error) {
      return <QueryError error={error} onRetry={refetch} offlineDescription={offlineDescription} />;
    }

    return children;
  }, [children, error, isPending, refetch, showLoading, offlineDescription]);

  return (
    <Container py="md" size="xl">
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
      {renderContent}
    </Container>
  );
}

export default Content;
