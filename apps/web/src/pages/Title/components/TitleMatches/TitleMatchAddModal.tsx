import { useState } from 'react';
import { Button, Stack, Text, TextInput } from '@mantine/core';
import { LinkIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
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
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={LinkIcon}
      opened={opened}
      onClose={handleClose}
      title={t('addTitleManually')}
    >
      <Stack gap="sm">
        <Text c="dimmed" fz={13}>
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
    </ToneModal>
  );
}

export default TitleMatchAddModal;
