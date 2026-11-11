import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import ToastAction from './ToastAction';

const META = {
  title: 'UI/ToastAction',
  component: ToastAction,
  args: { children: 'Вернуть закладку', icon: <ArrowCounterClockwiseIcon />, onClick: fn() },
  decorators: [
    (Story) => (
      <Box p="md" w={250}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ToastAction>;
export default META;
type Story = StoryObj<typeof META>;
export const Default: Story = { name: 'Обычная' };
export const LongLabel: Story = {
  name: 'Длинная подпись',
  args: { children: 'Вернуть тайтл с очень длинным названием в прежнюю папку закладок' },
};
