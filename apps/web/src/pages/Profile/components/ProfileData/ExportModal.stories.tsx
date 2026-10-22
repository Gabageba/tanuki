import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import ExportModal from './ExportModal';

const META = {
  title: 'Модалки/Профиль/ExportModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Экспорт',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ExportModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};
