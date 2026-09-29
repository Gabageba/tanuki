import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { BroomIcon, DownloadSimpleIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import ClearCacheModal from './ClearCacheModal';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import useStorageEstimate from './hooks/useStorageEstimate';
import { getStorageSizeLabel } from './lib';

function ProfileData() {
  const { t, i18n } = useTranslation();
  const { data: storage, isPending: isStoragePending } = useStorageEstimate();
  const [isExportOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
  const [isImportOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);
  const [isClearCacheOpened, { open: openClearCacheModal, close: closeClearCacheModal }] =
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
        </GroupedList>
        <GroupedList label={t('storage')} loading={isStoragePending} skeletonRows={2}>
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
            icon={<TrashIcon />}
            title={t('deleteDownloadedChapters')}
            description={
              storage && (
                <Text fz="sm" c="dimmed" ff="monospace">
                  {t('occupiedOfTotal', {
                    used: getStorageSizeLabel(storage.usage, t, i18n.language),
                    total: getStorageSizeLabel(storage.quota, t, i18n.language),
                  })}
                </Text>
              )
            }
            actionProps={{
              color: 'red',
              variant: 'muted',
              leftSection: <TrashIcon />,
              onClick: openClearCacheModal,
              children: t('delete'),
              disabled: true,
            }}
          />
        </GroupedList>
      </SimpleGrid>

      <ExportModal opened={isExportOpened} onClose={closeExportModal} />
      <ImportModal opened={isImportOpened} onClose={closeImportModal} />
      <ClearCacheModal opened={isClearCacheOpened} onClose={closeClearCacheModal} />
    </Stack>
  );
}

export default ProfileData;
