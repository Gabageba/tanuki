import type { Meta, StoryObj } from '@storybook/react-vite';
import ModalStage from '@/shared/storybook/ModalStage';
import MobileSourceSelect from './MobileSourceSelect';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Навигация/MobileSourceSelect',
  globals: MOBILE_GLOBALS,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Выбор источника',
  render: () => (
    <ModalStage>
      {({ opened, setOpened }) => (
        <MobileSourceSelect isActive isOpened={opened} setIsOpened={setOpened} />
      )}
    </ModalStage>
  ),
};
