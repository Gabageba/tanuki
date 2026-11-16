import { Button, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { LinkIcon } from '@phosphor-icons/react';
import { parseTitleLink } from '../lib';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import { CONTAINED_OVERLAY_STYLES } from '../models';

type Props = {
  opened: boolean;
  onClose: () => void;
  onAdd: (targetId: string) => void;
};

function ManualLinkModal({ opened, onClose, onAdd }: Props) {
  const form = useForm({
    initialValues: { link: '' },
    validate: { link: (value) => (parseTitleLink(value) ? null : 'Это не ссылка на тайтл') },
  });
  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ToneModal
      opened={opened}
      onClose={handleClose}
      title="Добавить тайтл вручную"
      tone={MODAL_TONE.NEUTRAL}
      icon={LinkIcon}
      withinPortal={false}
      lockScroll={false}
      trapFocus={false}
      returnFocus={false}
      styles={{ ...CONTAINED_OVERLAY_STYLES, inner: { position: 'absolute', padding: 16 } }}
    >
      <form
        onSubmit={form.onSubmit(({ link }) => {
          const targetId = parseTitleLink(link);
          if (!targetId) return;
          onAdd(targetId);
          handleClose();
        })}
      >
        <Stack gap="sm">
          <Text c="dimmed" fz={13}>
            Откройте нужный тайтл на другом источнике и вставьте сюда ссылку из адресной строки.
          </Text>
          <TextInput
            placeholder="Ссылка на тайтл"
            leftSection={<LinkIcon />}
            {...form.getInputProps('link')}
          />
          <Button type="submit" leftSection={<LinkIcon />}>
            Добавить тайтл
          </Button>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default ManualLinkModal;
