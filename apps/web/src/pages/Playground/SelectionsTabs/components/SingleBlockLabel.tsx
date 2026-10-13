import { Group, Text } from '@mantine/core';
import { getBlockKindIcon } from '../lib';
import type { MockBlock } from '../models';

type Props = {
  block: MockBlock;
};

/** Z1b — у источника один блок: переключать нечего, поэтому вместо вкладок — его название. */
function SingleBlockLabel({ block }: Props) {
  return (
    <Group gap={6} wrap="nowrap" c="dimmed">
      {getBlockKindIcon(block.kind)}
      <Text fz="sm" fw={600} c="var(--mantine-color-text)">
        {block.title}
      </Text>
    </Group>
  );
}

export default SingleBlockLabel;
