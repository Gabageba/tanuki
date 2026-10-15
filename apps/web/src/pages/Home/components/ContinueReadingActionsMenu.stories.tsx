import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn } from 'storybook/test';
import { clickFirstButton } from '@/shared/storybook/play';
import ContinueReadingActionsMenu from './ContinueReadingActionsMenu';

const META = {
  title: 'Меню/ContinueReadingActionsMenu',
  render: () => (
    <Box p="md">
      <ContinueReadingActionsMenu onRemove={fn().mockName('onRemove')} />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню карточки «Продолжить чтение»',
};
