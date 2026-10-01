import { Group, Paper, Stack, Switch, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Карточка в тон Radio.Card соседних настроек. Вся карточка — label, так что переключается
 *  кликом в любое её место, а не только по самому переключателю. */
function ReaderSettingSwitch({ title, description, icon, checked, onChange }: Props) {
  return (
    <Paper component="label" withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
      <Group align="flex-start" gap="xs" wrap="nowrap">
        {icon}
        <Stack flex={1} gap={4}>
          <Title order={6} lh="tight">
            {title}
          </Title>
          <Text fz={12} c="dimmed" lh="tight">
            {description}
          </Text>
        </Stack>
        <Switch checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      </Group>
    </Paper>
  );
}

export default ReaderSettingSwitch;
