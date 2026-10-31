import { Button } from '@mantine/core';
import { FileIcon } from '@phosphor-icons/react';

/** T1 — путь назад к шагу «Файл», когда стрелки в заголовке нет. */
function OtherFileButton() {
  return (
    <Button variant="subtle" size="compact-xs" leftSection={<FileIcon />} w="fit-content">
      Выбрать другой файл
    </Button>
  );
}

export default OtherFileButton;
