import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { INVITE } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import RevokeInviteModal from './RevokeInviteModal';

const META = {
  title: 'Модалки/Управление/RevokeInviteModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Отзыв',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <RevokeInviteModal
          invite={opened ? INVITE : null}
          isPending={false}
          onClose={close}
          onConfirm={fn().mockName('onConfirm')}
        />
      )}
    </ModalStage>
  ),
};

export const Pending: Story = {
  name: 'Отзывается',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <RevokeInviteModal
          invite={opened ? INVITE : null}
          isPending
          onClose={close}
          onConfirm={fn().mockName('onConfirm')}
        />
      )}
    </ModalStage>
  ),
};
