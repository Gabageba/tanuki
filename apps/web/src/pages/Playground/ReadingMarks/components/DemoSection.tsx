import type { ReactNode } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';

type Props = {
  code: string;
  title: string;
  description: string;
  children: ReactNode;
};

/** Один вариант макета: код для обсуждения («A», «S3»), название, что в нём главное. */
function DemoSection({ code, title, description, children }: Props) {
  return (
    <Stack gap="xs" id={`variant-${code}`}>
      <Group gap="xs" wrap="nowrap">
        <Badge variant="filled" ff="monospace" flex="none">
          {code}
        </Badge>
        <Text fw={600}>{title}</Text>
      </Group>
      <Text fz="sm" c="dimmed">
        {description}
      </Text>
      {children}
    </Stack>
  );
}

export default DemoSection;
