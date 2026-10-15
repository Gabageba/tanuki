import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { USER_ROLE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { CURRENT_USER } from '@/shared/storybook/fixtures';
import { apiPath } from '@/shared/storybook/handlers';
import CreateInviteButton from './CreateInviteButton';

const openModal = async () =>
  userEvent.click(await screen.findByRole('button', { name: I18N.t('createInvite') }));

const META = {
  title: 'Модалки/Управление/CreateInviteButton',
  render: () => <CreateInviteButton />,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const AdminForm: Story = {
  name: 'Форма: админ',
  play: openModal,
};

export const ModeratorForm: Story = {
  name: 'Форма: модератор',
  parameters: {
    msw: [
      http.get(apiPath('/auth/me'), () =>
        HttpResponse.json({ ...CURRENT_USER, role: USER_ROLE.MODERATOR }),
      ),
    ],
  },
  play: openModal,
};

export const Created: Story = {
  name: 'Создано',
  play: async () => {
    await openModal();
    await userEvent.click(await screen.findByRole('button', { name: I18N.t('create') }));
  },
};
