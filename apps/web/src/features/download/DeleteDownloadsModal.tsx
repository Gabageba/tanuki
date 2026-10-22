import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { deleteAllDownloads, deleteTitleDownloads } from '@/entities/download/queue';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  /** Тайтл — удаляются его главы; без него — всё скачанное и вся очередь. */
  title?: { id: string; name: string };
  opened: boolean;
  onClose: () => void;
};

/** Danger: в момент, когда главы нужны (без сети), вернуть их нельзя. */
function DeleteDownloadsModal({ title, opened, onClose }: Props) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const action = title ? t('deleteTitleDownloadedChapters') : t('deleteAllDownloadedChapters');

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await (title ? deleteTitleDownloads(user.id, title.id) : deleteAllDownloads(user.id));
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ToneModal
      tone={MODAL_TONE.DANGER}
      icon={TrashIcon}
      opened={opened}
      onClose={onClose}
      title={action}
    >
      <Stack gap="md">
        <Stack gap={6}>
          <Text fz="sm">
            {title
              ? t('titleDownloadedChaptersWillBeDeleted', { name: title.name })
              : t('allDownloadedChaptersWillBeDeleted')}
          </Text>
          <Text c="dimmed" fz={13}>
            {t('cantReadOfflineUntilRedownloadedProgressStays')}
          </Text>
        </Stack>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            color="red"
            leftSection={<TrashIcon />}
            loading={isDeleting}
            onClick={() => void handleDelete()}
          >
            {action}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </ToneModal>
  );
}

export default DeleteDownloadsModal;
