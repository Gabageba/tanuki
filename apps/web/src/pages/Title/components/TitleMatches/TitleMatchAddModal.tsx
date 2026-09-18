import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import type useSetTitleLink from '../../hooks/useSetTitleLink';
import { parseTitleLink } from '../../lib';

type Props = {
  opened: boolean;
  onClose: () => void;
  mutateTitleLink: ReturnType<typeof useSetTitleLink>['mutate'];
  isTitleLinkPending: boolean;
};

function TitleMatchAddModal({ opened, onClose, mutateTitleLink, isTitleLinkPending }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const targetId = parseTitleLink(value);
  const isInvalid = value.trim().length > 0 && targetId === null;

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const handleSubmit = () => {
    if (!targetId) return;
    mutateTitleLink(
      { targetId, verdict: TITLE_LINK_VERDICT.CONFIRMED },
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
          placeholder="/title/desume:eyJpZCI6..."
          error={isInvalid ? t('notATitleLink') : null}
          data-autofocus
        />
        <Button onClick={handleSubmit} disabled={!targetId} loading={isTitleLinkPending}>
          {t('add')}
        </Button>
      </Stack>
    </Modal>
  );
}

export default TitleMatchAddModal;
