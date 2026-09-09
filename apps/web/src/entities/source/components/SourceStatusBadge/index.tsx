import { Box, Group, Text, Tooltip } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusColor, getSourceStatusLabel } from '@/entities/source/lib';
import SourceStatusBadgeTooltip from './SourceStatusBadgeTooltip';

type Props = {
  source: Source;
};

function SourceStatusBadge({ source }: Props) {
  const color = getSourceStatusColor(source.status);

  return (
    <Tooltip label={<SourceStatusBadgeTooltip source={source} />} multiline maw={280}>
      <Group gap={6} align="center">
        <Box bg={color} bdrs="50%" w={6} h={6} mt={3} />
        <Text c={color} fz={12} lh={1}>
          {getSourceStatusLabel(source.status)}
        </Text>
      </Group>
    </Tooltip>
  );
}

export default SourceStatusBadge;
