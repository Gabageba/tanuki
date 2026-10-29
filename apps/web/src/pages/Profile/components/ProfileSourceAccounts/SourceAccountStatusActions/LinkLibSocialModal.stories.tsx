import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import { API_ERROR_CODE, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkLibSocialModal from './LinkLibSocialModal';

const LIBSOCIAL_SOURCES = SOURCES.filter(
  ({ authFamily }) => authFamily === SOURCE_AUTH_FAMILY.LIBSOCIAL,
);

const logIn = async () => {
  await userEvent.type(await screen.findByPlaceholderText(I18N.t('loginOrEmail')), 'reader');
  await userEvent.type(screen.getByPlaceholderText(I18N.t('password')), 'secret');
  await userEvent.keyboard('{Enter}');
};

const META = {
  title: 'Модалки/Профиль/LinkLibSocialModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkLibSocialModal
          sources={LIBSOCIAL_SOURCES}
          defaultTokenSourceId={LIBSOCIAL_SOURCES[0]?.id}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Password: Story = {
  name: 'Логин и пароль',
};

export const Token: Story = {
  name: 'Токен',
  play: async () => {
    await userEvent.click(await screen.findByRole('tab', { name: I18N.t('token') }));
  },
};

export const Code: Story = {
  name: 'Код из письма',
  play: logIn,
};

export const CodeRejected: Story = {
  name: 'Код не подошёл',
  parameters: {
    msw: [
      http.post(apiPath('/source-accounts/libsocial/login/code'), () =>
        apiError(API_ERROR_CODE.SOURCE_LOGIN_CODE_REJECTED, 'Источник не принял код'),
      ),
    ],
  },
  play: async () => {
    await logIn();
    await screen.findByText(I18N.t('enterCode'));
    await userEvent.keyboard('123456');
  },
};

export const CancelPendingLogin: Story = {
  name: 'Отмена до ответа источника',
  parameters: {
    msw: [
      http.post(apiPath('/source-accounts/libsocial/login'), async () => {
        await delay(300);
        return HttpResponse.json({ pendingSourceId: 'mangalib' });
      }),
    ],
  },
  play: async () => {
    await logIn();
    await userEvent.click(screen.getByRole('button', { name: I18N.t('cancel') }));
    const reopen = await screen.findByRole('button', { name: 'Открыть' });
    await waitFor(() => expect(reopen).toBeEnabled());
    await userEvent.click(reopen);
    const submit = await screen.findByRole('button', { name: I18N.t('logIn') });
    await waitFor(() => expect(submit).toBeEnabled());
    await expect(screen.getByPlaceholderText(I18N.t('loginOrEmail'))).toBeVisible();
    await expect(screen.queryByText(I18N.t('enterCode'))).not.toBeInTheDocument();
  },
};
