import type { ReactNode } from 'react';
import { Group, NumberFormatter, Paper, Stack, Text, type MantineColor } from '@mantine/core';

type Props = {
  label: string;
  value: number;
  unit: string;
  hint?: {
    icon: ReactNode;
    text: string;
    color?: MantineColor;
  };
};

function ProfileStatisticMetaCard({ label, value, unit, hint }: Props) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Text ff="monospace" fz={12} c="dimmed" tt="uppercase" lts={1} lh="tight">
          {label}
        </Text>
        <Stack gap={8}>
          <Group gap={8} align="baseline" wrap="nowrap">
            <Text ff="monospace" fz={38} fw={600} lh={1}>
              <NumberFormatter value={value} thousandSeparator=" " />
            </Text>
            <Text c="dimmed" lh="tight" tt="lowercase">
              {unit}
            </Text>
          </Group>
          {hint && (
            <Group gap={6} wrap="nowrap" c={hint.color ?? 'dimmed'}>
              {hint.icon}
              <Text fz="sm" c="inherit" lh="tight">
                {hint.text}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default ProfileStatisticMetaCard;
