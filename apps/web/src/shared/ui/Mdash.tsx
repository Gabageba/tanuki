import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';

type Props = BoxProps;

function Mdash({ ...restProps }: Props) {
  return <Box {...restProps}>&mdash;</Box>;
}

export default Mdash;
