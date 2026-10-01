import { Stack } from '@mantine/core';
import TextSkeleton from '../TextSkeleton';

type Props = {
  /** То же значение, что `lineClamp` у `CollapsibleText`. */
  lines: number;
};

function CollapsibleTextSkeleton({ lines }: Props) {
  return (
    <Stack gap={4}>
      <TextSkeleton lines={lines} lastLineWidth="100%" />
      <TextSkeleton lh="tight" w={125} />
    </Stack>
  );
}

export default CollapsibleTextSkeleton;
