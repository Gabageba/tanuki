import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { API_ERROR_CODE, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkInukoModal from './LinkInukoModal';

const INUKO_SOURCE = SOURCES.find(({ authFamily }) => authFamily === SOURCE_AUTH_FAMILY.INUKO);

const META = {
  title: 'Модалки/Профиль/LinkInukoModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkInukoModal source={INUKO_SOURCE} opened={opened} onClose={close} />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Обычная',
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
    await userEvent.click(await screen.findByRole('button', { name: I18N.t('logIn') }));
  },
};
