import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import { http } from 'msw';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkRemangaModal from './LinkRemangaModal';

const META = {
  title: 'Модалки/Профиль/LinkRemangaModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkRemangaModal
          source={SOURCES.find(({ id }) => id === 'remanga')}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
} satisfies Meta;
export default META;
type Story = StoryObj<typeof META>;

export const Password: Story = { name: 'Логин или почта и пароль' };
export const Token: Story = {
  name: 'Вход через Яндекс: перенос сессии',
  play: async () => {
    await userEvent.click(await screen.findByRole('tab', { name: I18N.t('token') }));
    await screen.findByPlaceholderText(I18N.t('cookieValue', { name: 'auth:token' }));
  },
};
export const PasswordRejected: Story = {
  name: 'Источник не принял пароль',
  parameters: {
    msw: [
      http.post(apiPath('/source-accounts/remanga/login'), () =>
        apiError(API_ERROR_CODE.SOURCE_LOGIN_FAILED, 'Источник не принял данные для входа'),
      ),
    ],
  },
  play: async () => {
    await userEvent.type(
      await screen.findByPlaceholderText(I18N.t('loginOrEmail')),
      'reader@example.com',
    );
    await userEvent.type(await screen.findByPlaceholderText(I18N.t('password')), 'wrong-password');
    const button = await screen.findByRole('button', { name: I18N.t('logIn') });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await screen.findByText('Источник не принял данные для входа');
  },
};
