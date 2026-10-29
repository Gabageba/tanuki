import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Trans, useTranslation } from 'react-i18next';
import { EMAIL_CHANGE_CODE_LENGTH } from '@tanuki/contracts';
import ResendVerificationButton from '@/entities/user/ResendVerificationButton';
import CodeConfirmationForm from '@/shared/ui/CodeConfirmationForm';
import useConfirmEmailChange from '../hooks/useConfirmEmailChange';

type Props = {
  email: string;
  onResend: () => Promise<unknown>;
  onConfirmed: () => void;
};

function EmailChangeCodeStep({ email, onResend, onConfirmed }: Props) {
  const { t } = useTranslation();
  const confirmEmailChange = useConfirmEmailChange();

  const confirm = (code: string) =>
    confirmEmailChange.mutateAsync(
      { code },
      {
        // Callback наблюдателя не вызывается после ухода с шага кода.
        onSuccess: () => {
          notifications.show({ color: 'green', message: t('emailChanged') });
          onConfirmed();
        },
      },
    );

  return (
    <CodeConfirmationForm
      length={EMAIL_CHANGE_CODE_LENGTH}
      description={
        <Trans
          i18nKey="weSentCodeTo"
          values={{ email }}
          components={{ email: <Text span inherit fw={600} c="var(--mantine-color-text)" /> }}
        />
      }
      isConfirming={confirmEmailChange.isPending}
      onConfirm={confirm}
      actions={(reset, reportError) => (
        <ResendVerificationButton
          email={email}
          onResend={async () => {
            reset();
            try {
              await onResend();
            } catch (error) {
              reportError(error);
              throw error;
            }
          }}
        />
      )}
    />
  );
}

export default EmailChangeCodeStep;
