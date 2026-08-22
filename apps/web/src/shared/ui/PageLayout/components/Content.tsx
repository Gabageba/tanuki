import { Center, Container, Group, Loader, Title } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import ApiErrorText from '../../ApiErrorText';
import usePageLayoutQuery from '../hooks/usePageLayoutQuery';

type Props = {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
};

function Content({ children, title, actions }: Props) {
  const { isLoading, isError, error } = usePageLayoutQuery();

  const renderContent = useMemo(() => {
    if (isLoading) {
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
  }, [children, error, isError, isLoading]);

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
