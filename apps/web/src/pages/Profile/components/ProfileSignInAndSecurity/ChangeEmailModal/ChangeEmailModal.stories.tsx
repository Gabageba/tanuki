import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import ChangeEmailModal from '.';

const fillForm = async () => {
  await userEvent.type(await screen.findByPlaceholderText(I18N.t('newEmail')), 'new@example.com');
  await userEvent.type(screen.getByPlaceholderText(I18N.t('currentPassword')), 'secret');
  await userEvent.keyboard('{Enter}');
};

const META = {
  title: 'Модалки/Профиль/ChangeEmailModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ChangeEmailModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Form: Story = {
  name: 'Шаг 1: почта и пароль',
};

export const EmailTaken: Story = {
  name: 'Шаг 1: почта занята',
  parameters: {
    msw: [
      http.post(apiPath('/account/email'), () =>
        apiError(API_ERROR_CODE.EMAIL_TAKEN, 'Эта почта уже занята'),
      ),
    ],
  },
  play: fillForm,
};

export const Code: Story = {
  name: 'Шаг 2: код',
  play: fillForm,
};
