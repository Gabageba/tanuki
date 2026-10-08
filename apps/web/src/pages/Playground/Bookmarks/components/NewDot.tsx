import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';

type Props = Omit<BoxProps, 'w' | 'h' | 'bdrs' | 'bg'> & {
  /** В строку с текстом — span и выравнивание по середине строки. */
  inline?: boolean;
};

/** Точка «есть новые главы» — акцентный кружок 8px. */
function NewDot({ inline = false, ...restProps }: Props) {
  return (
    <Box
      component="span"
      display={inline ? 'inline-block' : 'block'}
      w={8}
      h={8}
      bdrs="50%"
      flex="none"
      bg="var(--mantine-primary-color-filled)"
      style={inline ? { verticalAlign: 'middle' } : undefined}
      aria-label="Есть новые главы"
      {...restProps}
    />
  );
}

export default NewDot;
