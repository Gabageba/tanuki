import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <Modal opened={opened} onClose={handleClose} title={t('addTitleManually')} centered>
      <Stack gap="sm">
        <Text fz={14} c="dimmed">
          {t('pasteLinkFromOtherSource')}
        </Text>
        <TextInput
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder="/manga/desume:eyJpZCI6..."
          error={isInvalid ? t('notATitleLink') : null}
          data-autofocus
        />
        <Button onClick={handleSubmit} disabled={!targetId} loading={isMangaLinkPending}>
          {t('add')}
        </Button>
      </Stack>
    </Modal>
  );
}

export default MangaMatchAddModal;
