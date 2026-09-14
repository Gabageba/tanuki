import { Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import MidDot from '@/shared/ui/MidDot';
import type { MatchConfidence } from '@tanuki/contracts';
import { getMatchConfidenceColorByKey, getMatchConfidenceLabelByKey } from '../../lib';
import StatusIndicator from '@/shared/ui/StatusIndicator';

type Props = {
  confidence: MatchConfidence;
  matchesCount: number;
};

function MatchConfidenceLabel({ confidence, matchesCount }: Props) {
  const { t } = useTranslation();
  const color = getMatchConfidenceColorByKey(confidence);
  const label = getMatchConfidenceLabelByKey(confidence, t);

  return (
    <Group gap={4} pos="sticky" left={0} bg="var(--mantine-color-body)" style={{ zIndex: 3 }}>
      <StatusIndicator label={label} color={color} coloredText />
      <MidDot c={color} />
      <Text c={color}>{matchesCount}</Text>
    </Group>
  );
}

export default MatchConfidenceLabel;
