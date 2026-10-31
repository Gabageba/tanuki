import type { ReactNode } from 'react';
import { Button, Center, PinInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@phosphor-icons/react';
import { ApiRequestError } from '@/shared/api/client';
import ModalButtonsLayout from './ModalButtonsLayout';

type Props = {
  length: number;
  description: ReactNode;
  isConfirming: boolean;
  disabled?: boolean;
  onConfirm: (code: string) => Promise<unknown>;
  actions?: (reset: () => void, reportError: (error: unknown) => void) => ReactNode;
};

function CodeConfirmationForm({
  length,
  description,
  isConfirming,
  disabled = false,
  onConfirm,
  actions,
}: Props) {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: { code: '' },
    validate: {
      code: (value) =>
        value.length === length && /^\d+$/.test(value)
          ? null
          : t('enterCodeDigits', { count: length }),
    },
  });

  const reportError = (error: unknown) => {
    form.setFieldValue('code', '');
    form.setFieldError(
      'code',
      error instanceof ApiRequestError ? error.message : t('tryAgainLater'),
    );
  };

  const handleSubmit = form.onSubmit(({ code }) => {
    if (disabled || isConfirming) return;
    return onConfirm(code).catch(reportError);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <Center>
          <Stack>
            <Text c="dimmed" fz={13}>
              {description}
            </Text>
            <Stack gap="xs">
              <PinInput
                mx="auto"
                length={length}
                type="number"
                size="lg"
                oneTimeCode
                autoFocus
                ff="monospace"
                aria-label={t('enterCode')}
                {...form.getInputProps('code')}
                error={Boolean(form.errors.code)}
                disabled={disabled || isConfirming}
                onComplete={() => void handleSubmit()}
              />
              {form.errors.code && (
                <Text c="red" fz="sm" role="alert">
                  {form.errors.code}
                </Text>
              )}
            </Stack>
          </Stack>
        </Center>
        <ModalButtonsLayout>
          {actions?.(form.reset, reportError)}
          <Button
            type="submit"
            leftSection={<CheckIcon />}
            loading={isConfirming}
            disabled={disabled}
          >
            {t('confirmCode')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default CodeConfirmationForm;
