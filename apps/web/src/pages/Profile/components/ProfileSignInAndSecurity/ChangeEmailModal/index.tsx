import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import type { ChangeEmailRequest } from '@tanuki/contracts';
import useChangeEmail from '../hooks/useChangeEmail';
import EmailChangeFormStep from './EmailChangeFormStep';
import EmailChangeCodeStep from './EmailChangeCodeStep';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

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
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={EnvelopeSimpleIcon}
      opened={opened}
      onClose={handleClose}
      title={codeSent ? t('enterCode') : t('changeEmail')}
      onBack={codeSent ? () => setCodeSent(false) : undefined}
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
    </ToneModal>
  );
}

export default ChangeEmailModal;
