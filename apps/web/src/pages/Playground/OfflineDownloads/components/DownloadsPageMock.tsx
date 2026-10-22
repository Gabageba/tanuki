import type { ReactNode } from 'react';
import { Stack, Title } from '@mantine/core';

type Props = {
  children: ReactNode;
};

/** Страница «Загрузки»: заголовок и блоки. */
function DownloadsPageMock({ children }: Props) {
  return (
    <Stack gap="lg">
      <Title order={3}>Загрузки</Title>
      {children}
    </Stack>
  );
}

export default DownloadsPageMock;
