import { Center, Container, Loader, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
};

function PageLayout({ children, title, isLoading = false }: Props) {
  return (
    <Container py="md" size="xl">
      {title && (
        <Title order={2} mb="xl">
          {title}
        </Title>
      )}
      {isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        children
      )}
    </Container>
  );
}

export default PageLayout;
