import { Stack, Text } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusLabel, getSourceStatusReasonLabel } from '../../lib';
import { formatRelativeRu, formatRuDate } from '@/shared/lib/formatDate';

type Props = {
  source: Source;
};

function SourceStatusBadgeTooltip({ source }: Props) {
  return (
    <Stack gap={2}>
      <Text fz={12}>
        {getSourceStatusLabel(source.status)}
        {source.statusChangedAt && (
          <Text span ff="monospace" fz={12}>
            {` с ${formatRuDate(source.statusChangedAt)}`}
          </Text>
        )}
      </Text>
      {source.statusReason && (
        <Text fz={12} c="dimmed">
          {getSourceStatusReasonLabel(source.statusReason)}
        </Text>
      )}
      {source.checkedAt && (
        <Text fz={12} c="dimmed" ff="monospace">
          {`проверен ${formatRelativeRu(source.checkedAt)}`}
        </Text>
      )}
    </Stack>
  );
}

export default SourceStatusBadgeTooltip;
