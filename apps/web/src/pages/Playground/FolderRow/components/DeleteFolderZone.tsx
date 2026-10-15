import { Button, Divider, Group, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';

type Props = {
  onDelete: () => void;
};

/** D2 — удаление отдельной зоной под «Сохранить»: разделитель, что будет с тайтлами, кнопка. */
function DeleteFolderZone({ onDelete }: Props) {
  return (
    <Stack gap="sm">
      <Divider />
      <Group justify="space-between" gap="sm" wrap="nowrap">
        <Text c="dimmed" fz={13}>
          Тайтлы из папки можно будет перенести в другую.
        </Text>
        <Button
          variant="subtle"
          color="red"
          flex="none"
          leftSection={<TrashIcon />}
          onClick={onDelete}
        >
          Удалить папку
        </Button>
      </Group>
    </Stack>
  );
}

export default DeleteFolderZone;
