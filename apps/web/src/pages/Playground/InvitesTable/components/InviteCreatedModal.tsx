import { Button } from '@mantine/core';
import { CheckCircleIcon, CheckIcon, PlusIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MESSAGE_PATTERN, MESSAGE_TONE, type MessagePattern, type MockInvite } from '../models';
import InviteCreatedContent from './InviteCreatedContent';
import PatternModal from './PatternModal';

type Props = {
  invite: MockInvite | null;
  /** L2: код хранится, ссылку можно скопировать позже из карточки. */
  isLinkStored?: boolean;
  pattern?: MessagePattern;
  /** «Ещё одно» — вернуться к форме; без обработчика кнопки нет. */
  onCreateAnother?: () => void;
  onClose: () => void;
};

/** Готовая ссылка отдельным окном — после C3 и после «Перевыпустить» (L1). */
function InviteCreatedModal({
  invite,
  isLinkStored = false,
  pattern = MESSAGE_PATTERN.CURRENT,
  onCreateAnother,
  onClose,
}: Props) {
  return (
    <PatternModal
      pattern={pattern}
      tone={MESSAGE_TONE.SUCCESS}
      icon={CheckCircleIcon}
      opened={invite !== null}
      onClose={onClose}
      title="Приглашение создано"
      centered
    >
      {invite && (
        <>
          <InviteCreatedContent invite={invite} isLinkStored={isLinkStored} pattern={pattern} />
          <ModalButtonsLayout>
            {onCreateAnother && (
              <Button variant="default" leftSection={<PlusIcon />} onClick={onCreateAnother}>
                Ещё одно
              </Button>
            )}
            <Button leftSection={<CheckIcon />} onClick={onClose}>
              Готово
            </Button>
          </ModalButtonsLayout>
        </>
      )}
    </PatternModal>
  );
}

export default InviteCreatedModal;
