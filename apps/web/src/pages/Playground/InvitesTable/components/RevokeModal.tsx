import { Button, Stack, Text } from '@mantine/core';
import { LinkBreakIcon, XIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getRoleLabel } from '../lib';
import { MESSAGE_PATTERN, MESSAGE_TONE, type MessagePattern, type MockInvite } from '../models';
import ModalMessage from './ModalMessage';
import PatternModal from './PatternModal';

type Props = {
  invite: MockInvite | null;
  pattern?: MessagePattern;
  onClose: () => void;
  onConfirm: () => void;
};

/** R1: отзыв необратим — переспрашиваем модалкой. */
function RevokeModal({ invite, pattern = MESSAGE_PATTERN.CURRENT, onClose, onConfirm }: Props) {
  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.DANGER}
      icon={LinkBreakIcon}
      opened={invite !== null}
      onClose={onClose}
      title="Отзыв приглашения"
      centered
    >
      {invite && (
        <Stack gap="md">
          <ModalMessage
            pattern={pattern}
            tone={MESSAGE_TONE.DANGER}
            icon={LinkBreakIcon}
            main={`Приглашение в роль «${getRoleLabel(invite.role)}» перестанет работать: зарегистрироваться по ссылке будет нельзя.`}
            details={['Вернуть его не получится — только создать новое.']}
            current={
              <>
                <Text fz="sm">
                  Приглашение в роль «{getRoleLabel(invite.role)}» перестанет работать:
                  зарегистрироваться по ссылке будет нельзя.
                </Text>
                <Text c="dimmed" fz={13}>
                  Вернуть его не получится — только создать новое.
                </Text>
              </>
            }
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button color="red" leftSection={<XIcon />} onClick={onConfirm}>
              Отозвать
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </PatternModal>
  );
}

export default RevokeModal;
