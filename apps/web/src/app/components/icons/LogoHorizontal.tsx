import { Group, Text } from '@mantine/core';
import Logo from './Logo';
import type { IconProps } from './models';

function LogoHorizontal(props: IconProps) {
  return (
    <Group gap="xs">
      <Logo {...props} size={24} color="var(--mantine-primary-color-filled)" />
      <Text ff="var(--tanuki-font-brand)" fw={600} fz={16} style={{ letterSpacing: '-0.01em' }}>
        Tanuki
      </Text>
    </Group>
  );
}

export default LogoHorizontal;
