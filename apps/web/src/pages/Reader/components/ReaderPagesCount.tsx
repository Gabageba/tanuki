import type { TextProps } from '@mantine/core';
import { Text } from '@mantine/core';
import { isEmpty } from '@/shared/lib/isEmpty';

type Props = {
  pagesLength?: number | null;
} & Omit<TextProps, 'fz' | 'c' | 'textWrap'>;

function ReaderPagesCount({ pagesLength, ...restProps }: Props) {
  if (isEmpty(pagesLength)) {
    return null;
  }

  return (
    <Text fz={12} c="dimmed" textWrap="nowrap" {...restProps}>
      1 / {pagesLength}
    </Text>
  );
}

export default ReaderPagesCount;
