import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import ColorSchemeToggle from './ColorSchemeToggle';

const META = {
  title: 'UI/ColorSchemeToggle',
  component: ColorSchemeToggle,
  render: (args) => (
    <Box p="md">
      <ColorSchemeToggle {...args} />
    </Box>
  ),
} satisfies Meta<typeof ColorSchemeToggle>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'С рамкой' };
export const Subtle: Story = {
  name: 'В панели читалки',
  args: { variant: 'subtle', color: 'gray' },
};
