import type { Meta, StoryObj } from '@storybook/react-vite';
import { SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import ModalStage from '@/shared/storybook/ModalStage';
import LinkPasswordAccountModal from './LinkPasswordAccountModal';

const META = {
  title: 'Модалки/Профиль/LinkPasswordAccountModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Grouple: Story = {
  name: 'Вход в Grouple',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <LinkPasswordAccountModal
          family={SOURCE_AUTH_FAMILY.GROUPLE}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};
