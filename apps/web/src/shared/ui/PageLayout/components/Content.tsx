import { Center, Container, Group, Loader, Title } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import ApiErrorText from '../../ApiErrorText';
import useQuery from '../hooks/useQuery';
import GoBackButton from '../../GoBackButton';
import type { RoutePath } from '@/shared/consts/routes';

type Props = {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  showLoading?: boolean;
  goBack?: boolean | { path: RoutePath };
};

function Content({ children, title, actions, showLoading = true, goBack }: Props) {
  const { isPending, isError, error } = useQuery();

  const renderContent = useMemo(() => {
    if (isPending && showLoading) {
      return (
        <Center>
          <Loader />
        </Center>
      );
    }

    if (isError) {
      return <ApiErrorText error={error!} />;
    }

    return children;
  }, [children, error, isError, isPending, showLoading]);

  return (
    <Container py="md" size="xl">
      {(title || actions || !!goBack) && (
        <Group justify={title ? 'space-between' : 'flex-end'} mb="md">
          {(!!goBack || title) && (
            <Group gap="xs">
              {!!goBack && (
                <GoBackButton path={typeof goBack === 'object' ? goBack.path : undefined} />
              )}
              {title && <Title order={2}>{title}</Title>}
            </Group>
          )}
          {actions}
        </Group>
      )}
      {renderContent}
    </Container>
  );
}

export default Content;
