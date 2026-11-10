import { Paper, Stack, Text } from '@mantine/core';
import CurrentToastGallery from './CurrentToastGallery';

function CurrentToasts() {
  return (
    <Stack gap="lg">
      <Stack gap={6}>
        <Text fz="xs" ff="monospace" c="dimmed">
          Десктоп · 440 px
        </Text>
        <CurrentToastGallery />
      </Stack>
      <Stack gap={6} w={375} maw="100%">
        <Text fz="xs" ff="monospace" c="dimmed">
          Телефон · 375 px
        </Text>
        <Paper withBorder p="xs" radius="md">
          <CurrentToastGallery singleColumn />
        </Paper>
      </Stack>
    </Stack>
  );
}

export default CurrentToasts;
