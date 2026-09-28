import type { ReactNode } from 'react';
import { Group, Text } from '@mantine/core';

type Props = {
  value: ReactNode;
  caption: ReactNode;
};

function ProfileStatisticHeadline({ value, caption }: Props) {
  return (
    <Group gap={8} align="baseline">
      <Text ff="monospace" fz={35} fw={600} lh={1} style={{ wordSpacing: -8 }}>
        {value}
      </Text>
      <Text fz="sm" c="dimmed">
        {caption}
      </Text>
    </Group>
  );
}

export default ProfileStatisticHeadline;
