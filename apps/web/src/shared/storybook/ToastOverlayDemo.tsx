import { Button, Drawer, Stack, Text, TextInput } from '@mantine/core';
import { FloppyDiskIcon, FolderIcon } from '@phosphor-icons/react';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_PAUSE } from '@/shared/lib/toasts/models';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalStage from './ModalStage';

type Props = { drawer?: boolean };

function ToastOverlayDemo({ drawer = false }: Props) {
  const { t } = useTranslation();
  const form = useForm({ initialValues: { name: '' } });
  const show = () => {
    const id = Toasts.show({
      title: t('failedToSave'),
      description: t('noConnectionToServer'),
      tone: FEEDBACK_TONE.DANGER,
    });
    Toasts.pause(id, TOAST_PAUSE.HOVER, true);
  };
  const content = (
    <form onSubmit={form.onSubmit(show)}>
      <Stack>
        <Text fz="sm">
          Сохранение показывает ошибку поверх формы. Поля и кнопки доступны при небольшой высоте
          окна.
        </Text>
        <TextInput
          placeholder={t('name')}
          leftSection={<FolderIcon />}
          {...form.getInputProps('name')}
        />
        <Button type="submit" leftSection={<FloppyDiskIcon />}>
          {t('save')}
        </Button>
      </Stack>
    </form>
  );
  if (drawer)
    return (
      <ModalStage>
        {({ opened, close }) => (
          <Drawer opened={opened} onClose={close} title="Папка" position="right">
            {content}
          </Drawer>
        )}
      </ModalStage>
    );
  return (
    <ModalStage>
      {({ opened, close }) => (
        <ToneModal
          opened={opened}
          onClose={close}
          title="Папка"
          tone={MODAL_TONE.NEUTRAL}
          icon={FolderIcon}
        >
          {content}
        </ToneModal>
      )}
    </ModalStage>
  );
}
export default ToastOverlayDemo;
