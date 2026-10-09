import type { ReactNode } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../models';
import styles from '../Notifications.module.scss';

type Props = {
  children: ReactNode;
};

/** Рамка телефона 375 px: брейкпоинты Mantine смотрят на окно, а не на рамку, поэтому мобильную
 *  раскладку внутри выбирают по контексту. */
function PhoneFrame({ children }: Props) {
  return (
    <Stack gap={6} w={375} maw="100%" flex="none">
      <Text fz={12} c="dimmed" ff="monospace">
        375 px
      </Text>
      <Box p="sm" className={styles.frame} bg="var(--mantine-color-body)">
        <PHONE_FRAME_CONTEXT value>{children}</PHONE_FRAME_CONTEXT>
      </Box>
    </Stack>
  );
}

export default PhoneFrame;
