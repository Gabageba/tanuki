import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import ArrowLink from '.';

const META = {
  title: 'UI/ArrowLink',
  render: () => (
    <Box p="md">
      <ArrowLink to="/bookmarks">Все закладки</ArrowLink>
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Ссылка со стрелкой' };
