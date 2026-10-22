import type { Meta, StoryObj } from '@storybook/react-vite';
import { CREATED_INVITE } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import InviteCreatedModal from './InviteCreatedModal';

const META = {
  title: 'Модалки/Управление/InviteCreatedModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Reissued: Story = {
  name: 'Перевыпущено',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <InviteCreatedModal invite={opened ? CREATED_INVITE : null} onClose={close} />
      )}
    </ModalStage>
  ),
};
