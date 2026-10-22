import { ActionIcon, SimpleGrid, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
import ExportModal from './ExportModal';
import ImportFromSourceRow from './ImportFromSourceRow';
import ImportModal from './ImportModal';

function ProfileData() {
  const { t } = useTranslation();
  const downloads = useDownloadsTotal();
  // Удаление чистит и очередь, поэтому его не прячут, пока ни одна глава не докачалась.
  const hasDownloads = (downloads?.rowCount ?? 0) > 0;
  const [isExportOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
  const [isImportOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);
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
            title={t('bookmarksExport')}
            description={t('bookmarksProgressRatingsAndHistory')}
            actionProps={{
              leftSection: <DownloadSimpleIcon />,
              onClick: openExportModal,
              children: t('export'),
            }}
          />
          <GroupedList.Row
            icon={<UploadSimpleIcon />}
            title={t('bookmarksImport')}
            description={t('importDoesNotOverwriteProgress')}
            actionProps={{
              leftSection: <UploadSimpleIcon />,
              onClick: openImportModal,
              children: t('import'),
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

      <ExportModal opened={isExportOpened} onClose={closeExportModal} />
      <ImportModal opened={isImportOpened} onClose={closeImportModal} />
      <ClearCacheModal opened={isClearCacheOpened} onClose={closeClearCacheModal} />
      <DeleteDownloadsModal opened={isDeleteDownloadsOpened} onClose={closeDeleteDownloads} />
    </Stack>
  );
}

export default ProfileData;
