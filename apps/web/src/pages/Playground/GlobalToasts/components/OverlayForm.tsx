import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ArrowLeftIcon, CheckIcon, FolderIcon } from '@phosphor-icons/react';

type Props = { onSubmit: () => void; onClose: () => void; isModal: boolean };

function OverlayForm({ onSubmit, onClose, isModal }: Props) {
  const form = useForm({
    initialValues: { name: 'Читаю' },
    validate: { name: (value) => (value.trim() ? null : 'Введите название папки') },
  });
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <Text fz="sm">Измените название папки закладок.</Text>
        <TextInput
          placeholder="Название папки"
          leftSection={<FolderIcon />}
          {...form.getInputProps('name')}
        />
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={onClose}
            leftSection={isModal ? undefined : <ArrowLeftIcon />}
          >
            Отмена
          </Button>
          <Button type="submit" leftSection={<CheckIcon />}>
            Сохранить папку
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export default OverlayForm;
