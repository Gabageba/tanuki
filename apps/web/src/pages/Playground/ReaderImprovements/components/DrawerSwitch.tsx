import { Group, Paper, Stack, Switch, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
};
function DrawerSwitch({ title, description, icon, checked, onChange }: Props) {
  return (
    <Paper component="label" withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
      <Group align="flex-start" gap="xs" wrap="nowrap">
        {icon}
        <Stack flex={1} gap={4}>
          <Title order={6} lh="tight">
            {title}
          </Title>
          <Text fz="xs" c="dimmed" lh="tight">
            {description}
          </Text>
        </Stack>
        <Switch checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      </Group>
    </Paper>
  );
}
export default DrawerSwitch;
