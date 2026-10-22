import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ModalStage from '@/shared/storybook/ModalStage';
import AvatarCropModal from './AvatarCropModal';

const META = {
  title: 'Модалки/Профиль/AvatarCropModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Новый аватар',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <AvatarCropModal
          src={opened ? '/icon-512.png' : null}
          isSaving={false}
          onClose={close}
          onSave={fn().mockName('onSave')}
        />
      )}
    </ModalStage>
  ),
};
