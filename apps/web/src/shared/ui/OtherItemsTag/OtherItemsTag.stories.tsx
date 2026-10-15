import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group, Text } from '@mantine/core';
import OtherItemsTag from '.';

const META = {
  title: 'UI/OtherItemsTag',
  render: () => (
    <Group gap={0} p="md">
      <Text fz="sm">Модератор</Text>
      <OtherItemsTag count={2} />
    </Group>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: '+N' };
