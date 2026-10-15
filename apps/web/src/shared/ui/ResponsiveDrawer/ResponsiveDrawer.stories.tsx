import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Text } from '@mantine/core';
import ModalStage from '@/shared/storybook/ModalStage';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { DRAWER_POSITION, SHEET_HEIGHT, type DrawerSide, type SheetHeight } from './models';
import ResponsiveDrawer from '.';

const LINES = Array.from({ length: 12 }, (_, index) => (
  <Text key={index} fz="sm">
    Строка содержимого {index + 1}
  </Text>
));

const stageDrawer = (side?: DrawerSide, height?: SheetHeight) => (
  <ModalStage>
    {({ opened, close }) => (
      <ResponsiveDrawer
        opened={opened}
        onClose={close}
        side={side}
        height={height}
        title="Заголовок"
      >
        <Stack gap="xs">{LINES}</Stack>
      </ResponsiveDrawer>
    )}
  </ModalStage>
);

const META = {
  title: 'Дроверы/ResponsiveDrawer',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Right: Story = {
  name: 'Справа на широком экране',
  render: () => stageDrawer(DRAWER_POSITION.RIGHT),
};

export const Left: Story = {
  name: 'Слева на широком экране',
  render: () => stageDrawer(DRAWER_POSITION.LEFT),
};

export const SheetAuto: Story = {
  name: 'Снизу на телефоне, по содержимому',
  globals: MOBILE_GLOBALS,
  render: () => stageDrawer(DRAWER_POSITION.RIGHT),
};

export const SheetTall: Story = {
  name: 'Снизу на телефоне, высокий',
  globals: MOBILE_GLOBALS,
  render: () => stageDrawer(DRAWER_POSITION.RIGHT, SHEET_HEIGHT.TALL),
};
