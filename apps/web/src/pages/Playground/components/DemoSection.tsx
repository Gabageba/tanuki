import type { ReactNode } from 'react';
import { Badge, Group, List, SimpleGrid, Stack, Text } from '@mantine/core';
import { MinusCircleIcon, PlusCircleIcon } from '@phosphor-icons/react';

type Props = {
  code: string;
  title: string;
  description: string;
  /** Чем вариант хорош — показывается под самим вариантом. */
  pros?: string[];
  /** Чем вариант плох или чего стоит. */
  cons?: string[];
  children: ReactNode;
};

/** Один вариант макета: код для обсуждения («A», «S3»), название, что в нём главное. */
function DemoSection({ code, title, description, pros = [], cons = [], children }: Props) {
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
      {(pros.length > 0 || cons.length > 0) && (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" maw={1100} mt="xs">
          {pros.length > 0 && (
            <List
              fz="sm"
              spacing={4}
              icon={<PlusCircleIcon size={16} color="var(--mantine-color-teal-6)" />}
              center
            >
              {pros.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          )}
          {cons.length > 0 && (
            <List
              fz="sm"
              spacing={4}
              icon={<MinusCircleIcon size={16} color="var(--mantine-color-red-6)" />}
              center
            >
              {cons.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}

export default DemoSection;
