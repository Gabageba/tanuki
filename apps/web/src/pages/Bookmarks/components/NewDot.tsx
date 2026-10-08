import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = Omit<BoxProps, 'w' | 'h' | 'bdrs' | 'bg'>;

/** Точка «есть новые главы» — акцентный кружок 8px, без числа. */
function NewDot(props: Props) {
  const { t } = useTranslation();

  return (
    <Box
      component="span"
      display="block"
      w={8}
      h={8}
      bdrs="50%"
      flex="none"
      bg="var(--mantine-primary-color-filled)"
      role="img"
      aria-label={t('hasNewChapters')}
      {...props}
    />
  );
}

export default NewDot;
