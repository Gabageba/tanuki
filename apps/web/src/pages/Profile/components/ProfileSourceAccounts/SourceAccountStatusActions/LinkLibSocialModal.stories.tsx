import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent } from 'storybook/test';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { SOURCES } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkLibSocialModal from './LinkLibSocialModal';

const LIBSOCIAL_SOURCES = SOURCES.filter(
  ({ authFamily }) => authFamily === SOURCE_AUTH_FAMILY.LIBSOCIAL,
);

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
