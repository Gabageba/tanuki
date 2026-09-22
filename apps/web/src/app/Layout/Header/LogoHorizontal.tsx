import type { MantineBreakpoint } from '@mantine/core';
import { Group, Text } from '@mantine/core';
import Logo from './Logo';
import type { IconProps } from './models';

type Props = {
  textVisibleFrom?: MantineBreakpoint;
} & IconProps;

function LogoHorizontal({ textVisibleFrom, ...restProps }: Props) {
  return (
    <Group gap="xs">
      <Logo {...restProps} size={24} color="var(--mantine-primary-color-filled)" />
      <Text
        lh={1}
        ff="var(--tanuki-font-brand)"
        fw={600}
        fz={16}
        style={{ letterSpacing: '-0.01em' }}
        visibleFrom={textVisibleFrom}
      >
        Tanuki
      </Text>
    </Group>
  );
}

export default LogoHorizontal;
