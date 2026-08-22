import { Box, Container, Divider } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
};

function Header({ children }: Props) {
  return (
    <Container size="xl">
      <Box py="md">{children}</Box>
      <Divider />
    </Container>
  );
}

export default Header;
