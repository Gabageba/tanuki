import { Flex, Group, Radio, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; title: string; description: string; icon: ReactNode }[];
  disabled?: boolean;
};

function DrawerChoices({ label, value, onChange, items, disabled = false }: Props) {
  return (
    <Stack gap={8} opacity={disabled ? 0.5 : 1}>
      <Text c="dimmed">{label}</Text>
      {disabled && (
        <Text fz="xs" c="dimmed">
          Только в постраничном режиме
        </Text>
      )}
      <Radio.Group value={value} onChange={onChange} aria-label={label}>
        <Flex direction="column" gap={8}>
          {items.map((item) => (
            <Radio.Card
              key={item.value}
              value={item.value}
              p="md"
              variant="tile"
              disabled={disabled}
            >
              <Group align="flex-start" gap="xs" wrap="nowrap">
                {item.icon}
                <Stack flex={1} gap={4}>
                  <Title order={6} lh="tight">
                    {item.title}
                  </Title>
                  <Text fz="xs" c="dimmed" lh="tight">
                    {item.description}
                  </Text>
                </Stack>
              </Group>
            </Radio.Card>
          ))}
        </Flex>
      </Radio.Group>
    </Stack>
  );
}
export default DrawerChoices;
