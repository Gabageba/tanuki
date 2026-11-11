import type { ReactNode } from 'react';
import { useElementSize } from '@mantine/hooks';
import { Box, Paper, Stack, Text } from '@mantine/core';
import FooterMock from '../../Home/components/FooterMock';
import { MOCK_PAGE } from '../../Home/models';
import { VIEWPORT_CONTEXT, type ViewportContext } from '../models';
import { getViewportBackground } from '../lib';
import styles from '../GlobalToasts.module.scss';

type Props = {
  children: ReactNode;
  label: string;
  mobile?: boolean;
  context?: ViewportContext;
  height?: number;
  width?: number;
  toastWidth?: number;
  gap?: number;
  content?: ReactNode;
};

function ToastViewport({
  children,
  label,
  mobile = false,
  context = VIEWPORT_CONTEXT.APP,
  height = 520,
  width,
  toastWidth = 360,
  gap = 8,
  content,
}: Props) {
  const { ref, height: toastHeight } = useElementSize();
  const footer = mobile && context === VIEWPORT_CONTEXT.APP;
  return (
    <Stack gap={6} w={width ?? (mobile ? 375 : 680)} maw="100%" miw={0}>
      <Text fz="xs" c="dimmed" ff="monospace">
        {label}
      </Text>
      <Paper
        withBorder
        radius="md"
        h={height}
        pos="relative"
        className={styles.viewport}
        bg={getViewportBackground(context)}
      >
        {content && (
          <Box p="md" pb={toastHeight + (footer ? 80 : 24)} h="100%" style={{ overflowY: 'auto' }}>
            {content}
          </Box>
        )}
        <Stack
          ref={ref}
          pos="absolute"
          left={mobile ? 12 : undefined}
          right={12}
          bottom={`calc(${footer ? 68 : 12}px + env(safe-area-inset-bottom, 0px))`}
          w={mobile ? undefined : toastWidth}
          maw="calc(100% - 24px)"
          gap={gap}
        >
          {children}
        </Stack>
        {footer && (
          <Box pos="absolute" left={0} right={0} bottom={0}>
            <FooterMock withHome page={MOCK_PAGE.HOME} />
          </Box>
        )}
      </Paper>
    </Stack>
  );
}

export default ToastViewport;
