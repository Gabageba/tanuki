import type { ReactNode } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../models';
import styles from '../Bookmarks.module.scss';

type Props = {
  children: ReactNode;
  label?: string;
  width?: number;
};

/** Рамка телефона фиксированной ширины: вариант виден в мобильной раскладке без ресайза окна.
 *  Брейкпоинты Mantine смотрят на окно, а не на рамку, — поэтому внутри раскладка задаётся явно. */
function PhoneFrame({ children, label = '375 px', width = 375 }: Props) {
  return (
    <Stack gap={6} w={width} maw="100%" flex="none">
      <Text fz={12} c="dimmed" ff="monospace">
        {label}
      </Text>
      <Box p="sm" className={styles.phoneFrame} bg="var(--mantine-color-body)">
        <PHONE_FRAME_CONTEXT value>{children}</PHONE_FRAME_CONTEXT>
      </Box>
    </Stack>
  );
}

export default PhoneFrame;
