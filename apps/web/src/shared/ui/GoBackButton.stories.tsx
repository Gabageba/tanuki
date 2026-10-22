import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn } from 'storybook/test';
import GoBackButton from './GoBackButton';

const META = {
  title: 'UI/GoBackButton',
  render: () => (
    <Box p="md">
      <GoBackButton onClick={fn().mockName('onClick')} />
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Назад' };
