import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import MobileMenuButton from './MobileMenuButton';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Навигация/MobileMenuButton',
  globals: MOBILE_GLOBALS,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню',
  render: () => (
    <ModalStage>
      {({ opened, setOpened }) => (
        <MobileMenuButton isActive={false} isOpened={opened} setIsOpened={setOpened} />
      )}
    </ModalStage>
  ),
};
