import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { MANGA_LINK_VERDICT } from '@tanuki/contracts';
import type useSetMangaLink from '../../hooks/useSetMangaLink';
import { parseMangaLink } from '../../lib';

type Props = {
  opened: boolean;
  onClose: () => void;
  mutateMangaLink: ReturnType<typeof useSetMangaLink>['mutate'];
  isMangaLinkPending: boolean;
};

function MangaMatchAddModal({ opened, onClose, mutateMangaLink, isMangaLinkPending }: Props) {
  const [value, setValue] = useState('');
  const targetId = parseMangaLink(value);
  const isInvalid = value.trim().length > 0 && targetId === null;

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const handleSubmit = () => {
    if (!targetId) return;
    mutateMangaLink(
      { targetId, verdict: MANGA_LINK_VERDICT.CONFIRMED },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Добавить тайтл вручную" centered>
      <Stack gap="sm">
        <Text fz={14} c="dimmed">
          Откройте нужный тайтл на другом источнике и вставьте сюда ссылку из адресной строки.
        </Text>
        <TextInput
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder="/manga/desume:eyJpZCI6..."
          error={isInvalid ? 'Не похоже на ссылку на страницу тайтла' : null}
          data-autofocus
        />
        <Button onClick={handleSubmit} disabled={!targetId} loading={isMangaLinkPending}>
          Добавить
        </Button>
      </Stack>
    </Modal>
  );
}

export default MangaMatchAddModal;
