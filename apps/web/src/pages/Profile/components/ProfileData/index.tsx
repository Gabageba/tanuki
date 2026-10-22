import { ActionIcon, SimpleGrid, Stack } from '@mantine/core';
import { useDisclosure, useNetwork } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  BroomIcon,
  CaretRightIcon,
  DownloadSimpleIcon,
  TrashIcon,
  TrayArrowDownIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import DownloadsTotalMeta from '@/entities/download/DownloadsTotalMeta';
import useDownloadsTotal from '@/entities/download/hooks/useDownloadsTotal';
import DeleteDownloadsModal from '@/features/download/DeleteDownloadsModal';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import GroupedList from '@/shared/ui/GroupedList';
import ClearCacheModal from './ClearCacheModal';
import useDownloadBackup from './hooks/useDownloadBackup';
import ImportFromSourceRow from './ImportFromSourceRow';
import RestoreBackupModal from './RestoreBackupModal';

function ProfileData() {
  const { t } = useTranslation();
  const downloads = useDownloadsTotal();
  // Удаление чистит и очередь, поэтому его не прячут, пока ни одна глава не докачалась.
  const hasDownloads = (downloads?.rowCount ?? 0) > 0;
  // Копию собирает и разбирает сервер — без сети обе кнопки выключены.
  const { online } = useNetwork();
  const downloadBackup = useDownloadBackup();
  const [isRestoreOpened, { open: openRestoreModal, close: closeRestoreModal }] =
    useDisclosure(false);
  const [isClearCacheOpened, { open: openClearCacheModal, close: closeClearCacheModal }] =
    useDisclosure(false);
  const [isDeleteDownloadsOpened, { open: openDeleteDownloads, close: closeDeleteDownloads }] =
    useDisclosure(false);

  return (
    <Stack mt="lg" gap="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <GroupedList label={t('importAndExport')}>
          <GroupedList.Row
            icon={<DownloadSimpleIcon />}
            title={t('createBackup')}
            description={t('bookmarksProgressStatisticsAndSettings')}
            actionProps={{
              leftSection: <DownloadSimpleIcon />,
              onClick: () => downloadBackup.mutate(),
              loading: downloadBackup.isPending,
              disabled: !online,
              children: t('downloadBackup'),
            }}
          />
          <GroupedList.Row
            icon={<UploadSimpleIcon />}
            title={t('restoreFromBackup')}
            description={t('addsToLibraryDeletingNothingUnasked')}
            actionProps={{
              leftSection: <UploadSimpleIcon />,
              onClick: openRestoreModal,
              disabled: !online,
              children: t('recover'),
            }}
          />
          <ImportFromSourceRow />
        </GroupedList>
        <GroupedList label={t('storage')} loading={downloads === undefined} skeletonRows={3}>
          <GroupedList.Row
            icon={<BroomIcon />}
            title={t('clearBrowserCache')}
            description={t('resetsSavedPageDataAndReloads')}
            actionProps={{
              color: 'red',
              variant: 'muted',
              leftSection: <BroomIcon />,
              onClick: openClearCacheModal,
              children: t('clear'),
            }}
          />
          <GroupedList.Row
            icon={<TrayArrowDownIcon />}
            title={t('downloads')}
            description={<DownloadsTotalMeta />}
            isActionCompact
            action={
              <ActionIcon
                component={Link}
                to={ROUTE_PATHS.DOWNLOADS}
                variant="subtle"
                color="gray"
                aria-label={t('openDownloads')}
              >
                <CaretRightIcon />
              </ActionIcon>
            }
          />
          <GroupedList.Row
            icon={<TrashIcon />}
            title={t('deleteAllDownloadedChapters')}
            description={t('cantReadOfflineUntilRedownloaded')}
            disabled={!hasDownloads}
            actionProps={{
              color: 'red',
              variant: 'muted',
              leftSection: <TrashIcon />,
              onClick: openDeleteDownloads,
              children: t('delete'),
              disabled: !hasDownloads,
            }}
          />
        </GroupedList>
      </SimpleGrid>

      <RestoreBackupModal opened={isRestoreOpened} onClose={closeRestoreModal} />
      <ClearCacheModal opened={isClearCacheOpened} onClose={closeClearCacheModal} />
      <DeleteDownloadsModal opened={isDeleteDownloadsOpened} onClose={closeDeleteDownloads} />
    </Stack>
  );
}

export default ProfileData;
