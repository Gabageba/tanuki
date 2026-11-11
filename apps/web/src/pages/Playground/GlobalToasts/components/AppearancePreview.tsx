import { Paper, Stack, Text } from '@mantine/core';
import type { ToastAppearance, ToastSample } from '../models';
import ToastGallery from './ToastGallery';

type Props = { appearance?: Partial<ToastAppearance>; width?: number; samples?: ToastSample[] };

function AppearancePreview({ appearance, width, samples }: Props) {
  return (
    <Stack gap="lg">
      <Stack gap={6}>
        <Text fz="xs" ff="monospace" c="dimmed">
          Десктоп
        </Text>
        <ToastGallery appearance={appearance} width={width} samples={samples} />
      </Stack>
      <Stack gap={6} w={375} maw="100%">
        <Text fz="xs" ff="monospace" c="dimmed">
          Телефон · 375 px
        </Text>
        <Paper withBorder p="xs" radius="md">
          <ToastGallery appearance={appearance} width={351} samples={samples} singleColumn />
        </Paper>
      </Stack>
    </Stack>
  );
}

export default AppearancePreview;
