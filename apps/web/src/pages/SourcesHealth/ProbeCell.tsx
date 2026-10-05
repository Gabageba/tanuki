import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  source: Source;
};

/** Давность ночной проверки и, если она падает, сколько ночей подряд. Ни разу не проверялся
 *  (или выключен в каталоге — `broken`) — прочерк. */
function ProbeCell({ source }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();

  if (!source.checkedAt) return <Mdash lh="tight" c="dimmed" fz="sm" />;

  return (
    <Stack gap={2}>
      <Text fz="sm" lh="tight">
        {formatRelative(source.checkedAt)}
      </Text>
      {source.failedProbeStreak > 0 && (
        <Text fz="xs" c="dimmed" lh="tight">
          {t('countNightsInRow', { count: source.failedProbeStreak })}
        </Text>
      )}
    </Stack>
  );
}

export default ProbeCell;
