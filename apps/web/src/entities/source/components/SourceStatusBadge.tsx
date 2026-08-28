import { Box, Group, Text } from '@mantine/core';
import type { SourceStatus } from '@tanuki/contracts';
import { getSourceStatusColor, getSourceStatusLabel } from '@/entities/source/lib';

type Props = {
  status: SourceStatus;
};

function SourceStatusBadge({ status }: Props) {
  const color = getSourceStatusColor(status);

  return (
    <Group gap={6} align="center">
      <Box bg={color} bdrs="50%" w={6} h={6} mt={3} />
      <Text c={color} fz={12} lh={1}>
        {getSourceStatusLabel(status)}
      </Text>
    </Group>
  );
}

export default SourceStatusBadge;
