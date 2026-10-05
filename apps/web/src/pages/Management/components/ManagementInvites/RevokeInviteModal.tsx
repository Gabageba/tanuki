import { Button, Stack, Text } from '@mantine/core';
import { LinkBreakIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Invite } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import { getUserRoleLabel } from '../../models';

type Props = {
  invite: Invite | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Отзыв необратим — переспрашиваем. */
function RevokeInviteModal({ invite, isPending, onClose, onConfirm }: Props) {
  const { t } = useTranslation();

  return (
    <ToneModal
      tone={MODAL_TONE.DANGER}
      icon={LinkBreakIcon}
      opened={invite !== null}
      onClose={onClose}
      title={t('inviteRevocation')}
    >
      {invite && (
        <Stack gap="md">
          <Stack gap={6}>
            <Text fz="sm">
              {t('inviteForRoleWillStopWorking', { role: getUserRoleLabel(invite.role, t) })}
            </Text>
            <Text c="dimmed" fz={13}>
              {t('cantBeRestoredOnlyCreateNew')}
            </Text>
          </Stack>
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button color="red" leftSection={<XIcon />} loading={isPending} onClick={onConfirm}>
              {t('revoke')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </ToneModal>
  );
}

export default RevokeInviteModal;
