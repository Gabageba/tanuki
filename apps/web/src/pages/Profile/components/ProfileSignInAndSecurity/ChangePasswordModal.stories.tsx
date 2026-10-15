import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import ChangePasswordModal from './ChangePasswordModal';

const META = {
  title: 'Модалки/Профиль/ChangePasswordModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ChangePasswordModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Форма',
};

export const Validation: Story = {
  name: 'Ошибки формы',
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText(I18N.t('newPassword')), '123');
    await userEvent.click(screen.getByRole('button', { name: I18N.t('save') }));
  },
};

export const WrongPassword: Story = {
  name: 'Неверный текущий пароль',
  parameters: {
    msw: [
      http.all(apiPath('/account/password'), () =>
        apiError(API_ERROR_CODE.WRONG_PASSWORD, 'Неверный пароль'),
      ),
    ],
  },
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText(I18N.t('currentPassword')), 'secret');
    await userEvent.type(screen.getByPlaceholderText(I18N.t('newPassword')), 'new-secret-123');
    await userEvent.click(screen.getByRole('button', { name: I18N.t('save') }));
  },
};
