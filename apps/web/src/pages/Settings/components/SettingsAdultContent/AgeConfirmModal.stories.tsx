import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ModalStage from '@/shared/storybook/ModalStage';
import AgeConfirmModal from './AgeConfirmModal';

const META = {
  title: 'Модалки/Настройки/AgeConfirmModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Подтверждение возраста',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <AgeConfirmModal
          opened={opened}
          description="Источники и тайтлы 18+ появятся в каталоге, поиске и подборках."
          onConfirm={fn().mockName('onConfirm')}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};
