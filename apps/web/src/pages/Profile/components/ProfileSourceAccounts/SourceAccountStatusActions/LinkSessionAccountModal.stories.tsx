import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import { API_ERROR_CODE, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkSessionAccountModal from './LinkSessionAccountModal';

const INUKO_SOURCE = SOURCES.find(({ authFamily }) => authFamily === SOURCE_AUTH_FAMILY.INUKO);

const META = {
  title: 'Модалки/Профиль/LinkSessionAccountModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkSessionAccountModal
          family={SOURCE_AUTH_FAMILY.INUKO}
          cookieName="__otaku_session"
          description={I18N.t('loginProtectedByCaptcha')}
          source={INUKO_SOURCE}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Обычная',
};

export const Senkuro: Story = {
  name: 'Senkuro',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkSessionAccountModal
          family={SOURCE_AUTH_FAMILY.SENKURO}
          cookieName="access_token"
          description={I18N.t('loginProtectedByCaptcha')}
          source={SOURCES.find(({ id }) => id === 'senkuro')}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};

export const Senkognito: Story = {
  ...Senkuro,
  name: 'Senkognito',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkSessionAccountModal
          family={SOURCE_AUTH_FAMILY.SENKURO}
          cookieName="access_token"
          description={I18N.t('loginProtectedByCaptcha')}
          source={SOURCES.find(({ id }) => id === 'senkognito')}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};

export const SessionRejected: Story = {
  name: 'Сессия не принята',
  parameters: {
    msw: [
      http.post(apiPath('/source-accounts/:family/session'), () =>
        apiError(API_ERROR_CODE.SOURCE_LOGIN_FAILED, 'Источник не принял данные для входа'),
      ),
    ],
  },
  play: async () => {
    await userEvent.type(
      await screen.findByPlaceholderText(I18N.t('cookieValue', { name: '__otaku_session' })),
      'expired-session',
    );
    const button = await screen.findByRole('button', { name: I18N.t('logIn') });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  },
};
