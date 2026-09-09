import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { MANGA_LINK_VERDICT } from '@tanuki/contracts';
import { parseMangaLink } from './lib';

type Props = {
  opened: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (targetId: string, verdict: typeof MANGA_LINK_VERDICT.CONFIRMED) => void;
};

function MangaMatchAddModal({ opened, isSaving, onClose, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const targetId = parseMangaLink(value);
  const isInvalid = value.trim().length > 0 && targetId === null;

  const handleSubmit = () => {
    if (!targetId) return;
    onSubmit(targetId, MANGA_LINK_VERDICT.CONFIRMED);
    setValue('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Добавить тайтл вручную" centered>
      <Stack gap="sm">
        <Text fz={14} c="dimmed">
          Откройте нужный тайтл на другом источнике и вставьте сюда ссылку из адресной строки.
        </Text>
        <TextInput
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder="/manga/desume/eyJpZCI6..."
          error={isInvalid ? 'Не похоже на ссылку на страницу тайтла' : null}
          data-autofocus
        />
        <Button onClick={handleSubmit} disabled={!targetId} loading={isSaving}>
          Добавить
        </Button>
      </Stack>
    </Modal>
  );
}

export default MangaMatchAddModal;
