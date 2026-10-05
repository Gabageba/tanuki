import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { getLabelByContentType } from '@/entities/source/lib';
import useDateFormat from '@/shared/hooks/useDateFormat';
import DrawerField from '@/shared/ui/DrawerField';
import Mdash from '@/shared/ui/Mdash';
import HealthStatusBadge from './HealthStatusBadge';
import StatusSince from './StatusSince';

type Props = {
  source: Source;
};

/** Поля карточки источника. Причины среди них нет — она стоит заголовком над ошибкой ниже. */
function SourceFields({ source }: Props) {
  const { t } = useTranslation();
  const { formatDateTime, formatRelative } = useDateFormat();

  return (
    <Stack gap="sm">
      <DrawerField label={t('status')}>
        <HealthStatusBadge status={source.status} />
        <StatusSince statusChangedAt={source.statusChangedAt} />
      </DrawerField>
      <DrawerField label={t('content')}>
        <Text fz="sm">{getLabelByContentType(source.contentType, t)}</Text>
      </DrawerField>
      <DrawerField label={t('checked')}>
        {source.checkedAt ? (
          <>
            <Text fz="sm">{formatRelative(source.checkedAt)}</Text>
            <Text fz="xs" c="dimmed">
              {formatDateTime(source.checkedAt)}
            </Text>
          </>
        ) : (
          <Mdash c="dimmed" fz="sm" />
        )}
      </DrawerField>
      <DrawerField label={t('failedNightsInRow')}>
        <Text fz="sm" ff="monospace">
          {source.failedProbeStreak}
        </Text>
      </DrawerField>
    </Stack>
  );
}

export default SourceFields;
