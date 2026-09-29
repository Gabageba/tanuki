import { useState } from 'react';
import { Button, Center, PinInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Trans, useTranslation } from 'react-i18next';
import { CheckIcon } from '@phosphor-icons/react';
import { EMAIL_CHANGE_CODE_LENGTH } from '@tanuki/contracts';
import { ApiRequestError } from '@/shared/api/client';
import ResendVerificationButton from '@/entities/user/ResendVerificationButton';
import FormErrorAlert from '@/shared/ui/FormErrorAlert';
import useConfirmEmailChange from '../hooks/useConfirmEmailChange';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';

type Props = {
  email: string;
  onResend: () => Promise<unknown>;
  onConfirmed: () => void;
};

function EmailChangeCodeStep({ email, onResend, onConfirmed }: Props) {
  const { t } = useTranslation();
  const confirmEmailChange = useConfirmEmailChange();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirm = (value: string) => {
    setError(null);
    confirmEmailChange.mutate(
      { code: value },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: t('emailChanged') });
          onConfirmed();
        },
        onError: (mutationError) => {
          setCode('');
          setError(
            mutationError instanceof ApiRequestError ? mutationError.message : t('tryAgainLater'),
          );
        },
      },
    );
  };

  const handleResend = async () => {
    setCode('');
    setError(null);
    try {
      await onResend();
    } catch (resendError) {
      if (resendError instanceof ApiRequestError) setError(resendError.message);
      throw resendError;
    }
  };

  return (
    <Stack gap="lg">
      <Center>
        <Stack>
          <Text c="dimmed" fz={13}>
            <Trans
              i18nKey="weSentCodeTo"
              values={{ email }}
              components={{ email: <Text span inherit fw={600} c="var(--mantine-color-text)" /> }}
            />
          </Text>
          <Stack gap="xs">
            <PinInput
              length={EMAIL_CHANGE_CODE_LENGTH}
              type="number"
              size="lg"
              oneTimeCode
              autoFocus
              ff="monospace"
              value={code}
              error={Boolean(error)}
              disabled={confirmEmailChange.isPending}
              onChange={setCode}
              onComplete={confirm}
            />
            <FormErrorAlert error={error} />
          </Stack>
        </Stack>
      </Center>

      <ModalButtonsLayout>
        <ResendVerificationButton email={email} onResend={handleResend} />
        <Button
          leftSection={<CheckIcon />}
          loading={confirmEmailChange.isPending}
          disabled={code.length < EMAIL_CHANGE_CODE_LENGTH}
          onClick={() => confirm(code)}
        >
          {t('confirm')}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default EmailChangeCodeStep;
