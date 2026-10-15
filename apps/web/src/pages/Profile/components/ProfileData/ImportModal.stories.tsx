import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import ImportModal from './ImportModal';

const META = {
  title: 'Модалки/Профиль/ImportModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Импорт',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ImportModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};
