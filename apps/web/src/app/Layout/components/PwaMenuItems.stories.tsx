import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Menu } from '@mantine/core';
import { ListIcon } from '@phosphor-icons/react';
import { clickFirstButton } from '@/shared/storybook/play';
import { preparePwaOffers } from '@/shared/storybook/pwa';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import PwaMenuItems from './PwaMenuItems';

const META = {
  title: 'Меню/PwaMenuItems',
  beforeEach: preparePwaOffers,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Desktop: Story = {
  name: 'Установка и обновление',
  render: () => (
    <Box p="md">
      <Menu width={260}>
        <Menu.Target>
          <Button leftSection={<ListIcon />}>Меню</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <PwaMenuItems />
        </Menu.Dropdown>
      </Menu>
    </Box>
  ),
  play: clickFirstButton,
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
  render: () => (
    <Box p="xs">
      <PwaMenuItems mobile />
    </Box>
  ),
};
