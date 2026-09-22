import { Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

function AuthFormLayout({ title, description, children }: Props) {
  return (
    <Stack gap="xl" align="center">
      <Stack gap={4}>
        <Title order={2} ta="center" fz={20}>
          {title}
        </Title>
        <Text c="dimmed" ta="center">
          {description}
        </Text>
      </Stack>
      {children}
    </Stack>
  );
}

export default AuthFormLayout;
