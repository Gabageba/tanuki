import { Box, Group, Text } from '@mantine/core';
import type { SourceStatus } from '@tanuki/contracts';
import { getSourceStatusColor, getSourceStatusLabel } from '../models';

type Props = {
  status: SourceStatus;
};

function SourceStatusBadge({ status }: Props) {
  const color = getSourceStatusColor(status);

  return (
    <Group gap={6}>
      <Box bg={color} bdrs="50%" w={6} h={6} />
      <Text color={color} fz={12} lh={1}>
        {getSourceStatusLabel(status)}
      </Text>
    </Group>
  );
}

export default SourceStatusBadge;
