import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusLabel, getSourceStatusReasonLabel } from '../../lib';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  source: Source;
};

function SourceStatusBadgeTooltip({ source }: Props) {
  const { t } = useTranslation();
  const { formatDate, formatRelative } = useDateFormat();

  return (
    <Stack gap={2}>
      <Text fz={12}>
        {getSourceStatusLabel(source.status, t)}
        {source.statusChangedAt && (
          <Text span fz={12}>
            {` ${t('sinceDate', { date: formatDate(source.statusChangedAt) })}`}
          </Text>
        )}
      </Text>
      {source.statusReason && (
        <Text fz={12} c="dimmed">
          {getSourceStatusReasonLabel(source.statusReason, t)}
        </Text>
      )}
      {source.checkedAt && (
        <Text fz={12} c="dimmed">
          {t('checkedAgo', {
            relative: formatRelative(source.checkedAt),
          })}
        </Text>
      )}
    </Stack>
  );
}

export default SourceStatusBadgeTooltip;
