import { Button, Stack } from '@mantine/core';
import { CheckCircleIcon, CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { CreateInviteResponse } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import InviteCreatedContent from './InviteCreatedContent';

type Props = {
  invite: CreateInviteResponse | null;
  onClose: () => void;
};

/** Новая ссылка после «Перевыпустить» — то же окно, что после создания, но без «Ещё одно». */
function InviteCreatedModal({ invite, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <ToneModal
      tone={MODAL_TONE.SUCCESS}
      icon={CheckCircleIcon}
      opened={invite !== null}
      onClose={onClose}
      title={t('inviteCreated')}
    >
      {invite && (
        <Stack gap="md">
          <InviteCreatedContent invite={invite} />
          <ModalButtonsLayout>
            <Button leftSection={<CheckIcon />} onClick={onClose}>
              {t('done')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </ToneModal>
  );
}

export default InviteCreatedModal;
