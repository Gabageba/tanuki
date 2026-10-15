import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Source } from '@tanuki/contracts';
import { DOWN_SOURCE, SOURCES } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import SourceDrawer from './SourceDrawer';

const stageDrawer = (source: Source, isStaff: boolean) => (
  <ModalStage>
    {({ opened, close }) => (
      <SourceDrawer source={opened ? source : null} isStaff={isStaff} onClose={close} />
    )}
  </ModalStage>
);

const META = {
  title: 'Дроверы/Здоровье источников/SourceDrawer',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Down: Story = {
  name: 'Не работает, персонал',
  render: () => stageDrawer(DOWN_SOURCE, true),
};

export const Ok: Story = {
  name: 'Работает, пользователь',
  render: () => stageDrawer(SOURCES[1]!, false),
};
