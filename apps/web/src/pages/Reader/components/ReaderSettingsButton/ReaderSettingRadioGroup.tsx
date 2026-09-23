import type { FlexProps } from '@mantine/core';
import { Flex, Group, Radio, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  items: { id: string; title: string; description: string; icon: ReactNode }[];
  direction?: FlexProps['direction'];
};

function ReaderSettingRadioGroup({ value, onChange, items, direction = 'column' }: Props) {
  return (
    <Radio.Group value={value} onChange={onChange}>
      <Flex direction={direction} gap={8}>
        {items.map(({ id, title, description, icon }) => (
          <Radio.Card key={id} value={id} p="md" variant="tile">
            <Group align="flex-start" gap="xs">
              {icon}
              <Stack flex={1} gap={4}>
                <Title order={6} lh={1}>
                  {title}
                </Title>
                <Text fz={12} c="dimmed" lh={1}>
                  {description}
                </Text>
              </Stack>
            </Group>
          </Radio.Card>
        ))}
      </Flex>
    </Radio.Group>
  );
}

export default ReaderSettingRadioGroup;
