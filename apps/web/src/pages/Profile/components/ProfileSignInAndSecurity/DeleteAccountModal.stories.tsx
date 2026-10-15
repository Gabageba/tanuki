import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import DeleteAccountModal from './DeleteAccountModal';

const META = {
  title: 'Модалки/Профиль/DeleteAccountModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Удаление аккаунта',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <DeleteAccountModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};
