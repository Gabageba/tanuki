import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import DeleteDownloadsModal from '@/features/download/DeleteDownloadsModal';
import { formatSize } from '@/shared/lib/formatSize';
import DownloadsSectionHeader from './DownloadsSectionHeader';

type Props = {
  bytes: number;
};

/** Шапка «Скачанного»: общий объём и удаление всего. */
function DownloadedHeader({ bytes }: Props) {
  const { t, i18n } = useTranslation();
  const [isDeleteOpened, { open, close }] = useDisclosure(false);

  return (
    <>
      <DownloadsSectionHeader
        title={t('downloaded')}
        meta={formatSize(bytes, t, i18n.language)}
        action={
          <Button variant="muted" color="red" size="xs" leftSection={<TrashIcon />} onClick={open}>
            {t('deleteAllDownloadedChapters')}
          </Button>
        }
      />
      <DeleteDownloadsModal opened={isDeleteOpened} onClose={close} />
    </>
  );
}

export default DownloadedHeader;
