import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Center, PasswordInput, TextInput } from '@mantine/core';
import { SignInIcon, UserIcon } from '@phosphor-icons/react';
import AuthFormLayout from './AuthFormLayout';

const META = {
  title: 'UI/AuthFormLayout',
  render: () => (
    <Center p="xl">
      <AuthFormLayout title="С возвращением!" description="Продолжите читать там, где остановились">
        <TextInput w="100%" placeholder="Логин или почта" leftSection={<UserIcon />} />
        <PasswordInput w="100%" placeholder="Пароль" />
        <Button fullWidth leftSection={<SignInIcon />}>
          Войти
        </Button>
      </AuthFormLayout>
    </Center>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Форма входа' };
