import { SimpleGrid, Stack, Text } from '@mantine/core';
import PanelMock from './PanelMock';
import type { PanelLayout } from '../models';

type Props = { layout: PanelLayout };
function PanelFrames({ layout }: Props) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text fz="sm" c="dimmed">
          Компьютер · разворот
        </Text>
        <PanelMock layout={layout} />
      </Stack>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Stack gap="xs" w="100%" maw={375}>
          <Text fz="sm" c="dimmed">
            Телефон · разворот · 375 px
          </Text>
          <PanelMock layout={layout} mobile />
        </Stack>
        <Stack gap="xs" w="100%" maw={320}>
          <Text fz="sm" c="dimmed">
            Телефон · последняя страница · 320 px
          </Text>
          <PanelMock layout={layout} mobile single initiallyFullscreen />
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
export default PanelFrames;
