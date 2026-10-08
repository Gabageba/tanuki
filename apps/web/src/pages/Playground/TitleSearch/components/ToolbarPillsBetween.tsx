import type { ReactNode } from 'react';
import { Group } from '@mantine/core';

type Props = {
  filtersButton: ReactNode;
  viewSwitch: ReactNode;
  pills: ReactNode;
};

/** G2 — «Фильтры», пилюли и вид у правого края одной строкой: пилюли занимают дыру. */
function ToolbarPillsBetween({ filtersButton, viewSwitch, pills }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Group gap="sm" miw={0}>
        {filtersButton}
        {pills}
      </Group>
      {viewSwitch}
    </Group>
  );
}

export default ToolbarPillsBetween;
