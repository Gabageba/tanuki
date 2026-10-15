import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import ClearCacheModal from './ClearCacheModal';

const META = {
  title: 'Модалки/Профиль/ClearCacheModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Очистка кеша',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ClearCacheModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};
