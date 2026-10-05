import { CloseButton, Group, Paper, Stack } from '@mantine/core';
import type { DrawerLayout, MockSource, Viewer } from '../models';
import HealthDrawerContent from './HealthDrawerContent';
import HealthDrawerTitle from './HealthDrawerTitle';

type Props = {
  source: MockSource;
  layout: DrawerLayout;
  viewer: Viewer;
};

/** Карточка в рамке шириной с `Drawer` (420) — чтобы сравнить D1 и D2 без кликов. */
function DrawerPreview({ source, layout, viewer }: Props) {
  return (
    <Paper withBorder radius="md" p="md" w={420} maw="100%">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <HealthDrawerTitle source={source} layout={layout} />
          <CloseButton />
        </Group>
        <HealthDrawerContent source={source} layout={layout} viewer={viewer} />
      </Stack>
    </Paper>
  );
}

export default DrawerPreview;
