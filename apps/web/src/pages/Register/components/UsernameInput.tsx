import type { UseFormReturnType } from '@mantine/form';
import { TextInput } from '@mantine/core';
import { UserIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type useCheckUsername from '../hooks/useCheckUsername';
import type { RegisterFormValues } from '../models';

type Props = {
  form: UseFormReturnType<RegisterFormValues>;
  usernameCheck: ReturnType<typeof useCheckUsername>;
};

function UsernameInput({ form, usernameCheck }: Props) {
  const { t } = useTranslation();

  const isChecked =
    !form.errors.username &&
    usernameCheck.isPlausible &&
    !usernameCheck.isStale &&
    !usernameCheck.isPending;
  const isAvailable = isChecked && usernameCheck.data?.available === true;
  const isTaken = isChecked && !isAvailable;

  return (
    <TextInput
      autoComplete="username"
      placeholder={t('username')}
      leftSection={<UserIcon />}
      {...form.getInputProps('username')}
      error={isTaken ? t('taken') : form.errors.username}
      success={isAvailable ? t('available') : undefined}
    />
  );
}

export default UsernameInput;
