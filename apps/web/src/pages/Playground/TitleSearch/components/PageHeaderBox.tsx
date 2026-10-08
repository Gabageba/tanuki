import type { ReactNode } from 'react';
import { Box, Divider } from '@mantine/core';

type Props = {
  children: ReactNode;
};

/** Шапка страницы, как `PageLayout.Header`: отступ и линия снизу. */
function PageHeaderBox({ children }: Props) {
  return (
    <Box>
      <Box pb="md">{children}</Box>
      <Divider />
    </Box>
  );
}

export default PageHeaderBox;
