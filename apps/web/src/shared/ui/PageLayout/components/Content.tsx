import { Center, Container, Group, Loader, Title } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import ApiErrorText from '../../ApiErrorText';
import useQuery from '../hooks/useQuery';

type Props = {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  showLoading?: boolean;
};

function Content({ children, title, actions, showLoading = true }: Props) {
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
      {(title || actions) && (
        <Group justify={title ? 'space-between' : 'flex-end'} mb="md">
          {title && <Title order={2}>{title}</Title>}
          {actions}
        </Group>
      )}
      {renderContent}
    </Container>
  );
}

export default Content;
