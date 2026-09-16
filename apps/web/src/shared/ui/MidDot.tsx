import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';

type Props = BoxProps;

function MidDot({ ...restProps }: Props) {
  return (
    <Box component="span" {...restProps}>
      &middot;
    </Box>
  );
}

export default MidDot;
