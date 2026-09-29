import { useState } from 'react';
import { Group, Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ChangeEmailRequest } from '@tanuki/contracts';
import useChangeEmail from '../hooks/useChangeEmail';
import EmailChangeFormStep from './EmailChangeFormStep';
import GoBackButton from '@/shared/ui/GoBackButton';
import EmailChangeCodeStep from './EmailChangeCodeStep';

type Props = {
  opened: boolean;
  onClose: () => void;
};

function ChangeEmailModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const changeEmail = useChangeEmail();
  const [request, setRequest] = useState<ChangeEmailRequest | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const handleClose = () => {
    setRequest(null);
    setCodeSent(false);
    onClose();
  };

  const handleCodeSent = (sentRequest: ChangeEmailRequest) => {
    setRequest(sentRequest);
    setCodeSent(true);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        codeSent ? (
          <Group gap="xs">
            <GoBackButton onClick={() => setCodeSent(false)} />
            {t('enterCode')}
          </Group>
        ) : (
          t('changeEmail')
        )
      }
      centered
    >
      {codeSent && request ? (
        <EmailChangeCodeStep
          email={request.newEmail}
          onResend={() => changeEmail.mutateAsync(request)}
          onConfirmed={handleClose}
        />
      ) : (
        <EmailChangeFormStep
          initialValues={request}
          onCodeSent={handleCodeSent}
          onCancel={handleClose}
        />
      )}
    </Modal>
  );
}

export default ChangeEmailModal;
