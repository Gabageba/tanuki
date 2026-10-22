import { Button, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  /** Тайтл — удаляются его главы; без него — всё скачанное. */
  titleName?: string;
  opened: boolean;
  onClose: () => void;
};

/** Danger-модалка удаления скачанного: без сети вернуть главы нельзя. */
function DeleteDownloadedModal({ titleName, opened, onClose }: Props) {
  const action = titleName ? 'Удалить скачанные главы' : 'Удалить все скачанные главы';

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
            {titleName
              ? `Скачанные главы «${titleName}» удалятся с этого устройства.`
              : 'Все скачанные главы удалятся с этого устройства, очередь очистится.'}
          </Text>
          <Text c="dimmed" fz={13}>
            Без сети их не прочитать, пока не скачаете заново. Закладки и прогресс чтения останутся.
          </Text>
        </Stack>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button color="red" leftSection={<TrashIcon />} onClick={onClose}>
            {action}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </ToneModal>
  );
}

export default DeleteDownloadedModal;
