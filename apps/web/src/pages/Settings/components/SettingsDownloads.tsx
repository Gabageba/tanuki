import { Badge, Button, Progress, Text } from '@mantine/core';
import { HardDrivesIcon, ShieldCheckIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import DownloadsTotalMeta from '@/entities/download/DownloadsTotalMeta';
import useStorageEstimate from '@/shared/hooks/useStorageEstimate';
import { formatSize } from '@/shared/lib/formatSize';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import GroupedList from '@/shared/ui/GroupedList';

/** Вкладка «Загрузки» (S2a): сколько скачано, сколько места осталось и защищено ли скачанное от
 *  очистки браузером. Место браузер может не сообщить — тогда этих строк нет. */
function SettingsDownloads() {
  const { t, i18n } = useTranslation();
  const { data: storage, isPending } = useStorageEstimate();

  return (
    <GroupedList label={t('storage')} loading={isPending} skeletonRows={3}>
      <GroupedList.Row
        icon={<TrayArrowDownIcon />}
        title={t('downloadedShortForm')}
        description={<DownloadsTotalMeta />}
        action={
          <Button
            component={Link}
            to={ROUTE_PATHS.DOWNLOADS}
            variant="default"
            size="xs"
            leftSection={<TrayArrowDownIcon />}
          >
            {t('openDownloads')}
          </Button>
        }
      />
      {storage && (
        <GroupedList.Row
          icon={<HardDrivesIcon />}
          title={t('freeOnDevice')}
          description={
            <Text span inherit ff="monospace">
              {t('sizeOfTotal', {
                free: formatSize(storage.free, t, i18n.language),
                total: formatSize(storage.quota, t, i18n.language),
              })}
            </Text>
          }
        >
          <Progress
            size="sm"
            value={storage.quota > 0 ? (storage.usage / storage.quota) * 100 : 0}
          />
        </GroupedList.Row>
      )}
      {storage && (
        <GroupedList.Row
          icon={<ShieldCheckIcon />}
          title={t('protectionFromClearing')}
          description={t('browserWontDeleteDownloadsItself')}
          isActionCompact
          action={
            <Badge variant="muted" color={storage.isPersisted ? 'teal' : 'gray'}>
              {storage.isPersisted ? t('enabled') : t('disabled')}
            </Badge>
          }
        />
      )}
    </GroupedList>
  );
}

export default SettingsDownloads;
