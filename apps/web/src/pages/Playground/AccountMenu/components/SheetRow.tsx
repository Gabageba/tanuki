import type { ReactNode } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import styles from './SheetRow.module.scss';

type Props = {
  leftSection: ReactNode;
  children: ReactNode;
  isDanger?: boolean;
  /** M5b: строка выше — 40px вместо 35px у Menu.Item. */
  isLarge?: boolean;
};

/** Пункт мобильного меню в размерах Menu.Item: 14px, поля 6.67px × 12px, иконка с зазором 10px. */
function SheetRow({ leftSection, children, isDanger = false, isLarge = false }: Props) {
  return (
    <UnstyledButton
      className={styles.row}
      display="flex"
      w="100%"
      px="sm"
      py={isLarge ? 10 : 'calc(var(--mantine-spacing-xs) / 1.5)'}
      fz="sm"
      bdrs="var(--mantine-radius-default)"
      c={isDanger ? 'red' : 'var(--mantine-color-text)'}
      style={{ alignItems: 'center' }}
    >
      <Box display="flex" me="xs">
        {leftSection}
      </Box>
      {children}
    </UnstyledButton>
  );
}

export default SheetRow;
