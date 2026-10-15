import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MANAGED_USER } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import DeleteUserModal from './DeleteUserModal';

const META = {
  title: 'Модалки/Управление/DeleteUserModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Удаление',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <DeleteUserModal
          user={opened ? MANAGED_USER : null}
          isPending={false}
          onClose={close}
          onConfirm={fn().mockName('onConfirm')}
        />
      )}
    </ModalStage>
  ),
};
