import { Group, Stack, Text } from '@mantine/core';
import PlacementTable from './PlacementTable';
import SourcesPhone from './SourcesPhone';
import { getChangedKinds } from '../lib';
import type { DrawerPlacement } from '../models';
import { DRAWER_KIND } from '../models';

type Props = {
  placements: DrawerPlacement[];
  withPhone?: boolean;
};

/** Схема сторон и, если телефон отличается от соседних вариантов, — живой выбор источника. */
function LayoutPreview({ placements, withPhone = true }: Props) {
  const sources = placements.find((placement) => placement.kind === DRAWER_KIND.SOURCES);

  return (
    <Group align="flex-start" gap="xl">
      <PlacementTable placements={placements} changedKinds={getChangedKinds(placements)} />
      {withPhone && sources && (
        <Stack gap={6}>
          <Text fz="xs" c="dimmed">
            Телефон · выбор источника
          </Text>
          <SourcesPhone position={sources.phone} height={sources.phoneHeight} />
        </Stack>
      )}
    </Group>
  );
}

export default LayoutPreview;
