import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getSourceStatusLabel, getSourceStatusReasonLabel } from '../../lib';
import { formatDate, formatRelative } from '@/shared/lib/formatDate';

type Props = {
  source: Source;
};

function SourceStatusBadgeTooltip({ source }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <Stack gap={2}>
      <Text fz={12}>
        {getSourceStatusLabel(source.status, t)}
        {source.statusChangedAt && (
          <Text span ff="monospace" fz={12}>
            {` ${t('sinceDate', { date: formatDate(source.statusChangedAt, i18n.language) })}`}
          </Text>
        )}
      </Text>
      {source.statusReason && (
        <Text fz={12} c="dimmed">
          {getSourceStatusReasonLabel(source.statusReason, t)}
        </Text>
      )}
      {source.checkedAt && (
        <Text fz={12} c="dimmed" ff="monospace">
          {t('checkedAgo', {
            relative: formatRelative(source.checkedAt, i18n.language, t('justNow')),
          })}
        </Text>
      )}
    </Stack>
  );
}

export default SourceStatusBadgeTooltip;
