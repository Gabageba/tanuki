import { Group, Text } from '@mantine/core';
import type { MatchConfidence } from '@tanuki/contracts';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import MidDot from '@/shared/ui/MidDot';
import { getConfidenceColor, getConfidenceLabel } from '../lib';

type Props = { confidence: MatchConfidence; count: number };

function MatchGroupHeading({ confidence, count }: Props) {
  const color = getConfidenceColor(confidence);

  return (
    <Group gap={4} pos="sticky" left={0} bg="var(--mantine-color-body)">
      <StatusIndicator label={getConfidenceLabel(confidence)} color={color} coloredText />
      <MidDot c={color} />
      <Text c={color} ff="monospace">
        {count}
      </Text>
    </Group>
  );
}

export default MatchGroupHeading;
