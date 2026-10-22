import { Stack, Text } from '@mantine/core';
import { hasAnythingNew } from '../lib';
import type { BackupPreview } from '../models';

type Props = {
  preview: BackupPreview;
};

/** «Всё из копии уже есть» — повторное восстановление того же файла. «Восстановить» остаётся:
 *  может понадобиться ради настроек. */
function NothingNewNote({ preview }: Props) {
  if (hasAnythingNew(preview)) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Text fz="sm">Всё из копии уже есть.</Text>
      <Text c="dimmed" fz={13}>
        Восстановление ничего не добавит. Настройки из копии применятся, если включить их ниже.
      </Text>
    </Stack>
  );
}

export default NothingNewNote;
