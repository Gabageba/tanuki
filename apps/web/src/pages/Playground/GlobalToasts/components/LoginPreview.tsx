import {
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { LockIcon, SignInIcon, UserIcon } from '@phosphor-icons/react';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

type Props = { onSubmit: () => void };

/** Поля и раскладка Login; отправка остаётся внутри макета. */
function LoginPreview({ onSubmit }: Props) {
  const form = useForm({
    initialValues: { login: '', password: '', remember: false },
    validate: {
      login: (value) => (value.trim() ? null : 'Введите логин или почту'),
      password: (value) => (value ? null : 'Введите пароль'),
    },
  });
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <AuthFormLayout
        title="С возвращением"
        description="Продолжите с того места, где остановились"
      >
        <Stack w="100%" align="center">
          <Stack gap="sm" w="100%">
            <TextInput
              placeholder="Логин или почта"
              leftSection={<UserIcon />}
              autoComplete="off"
              {...form.getInputProps('login')}
            />
            <PasswordInput
              placeholder="Пароль"
              leftSection={<LockIcon />}
              autoComplete="off"
              {...form.getInputProps('password')}
            />
            <Group justify="space-between">
              <Checkbox
                size="xs"
                label="Запомнить меня"
                {...form.getInputProps('remember', { type: 'checkbox' })}
              />
              <Anchor component="button" type="button" fz="xs">
                Забыли пароль?
              </Anchor>
            </Group>
          </Stack>
          <Button type="submit" leftSection={<SignInIcon />} fullWidth>
            Войти
          </Button>
          <Divider w="100%" />
          <Text fz="xs" c="dimmed">
            Ещё нет аккаунта?{' '}
            <Anchor component="button" type="button" fz="xs">
              Создать
            </Anchor>
          </Text>
        </Stack>
      </AuthFormLayout>
    </form>
  );
}

export default LoginPreview;
