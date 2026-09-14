import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';

type Props = BoxProps;

function MidDot({ ...restProps }: Props) {
  return <Box {...restProps}>&middot;</Box>;
}

export default MidDot;
