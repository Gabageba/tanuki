import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group, Stack, Text } from '@mantine/core';
import Mdash from './Mdash';
import MidDotGroup from './MidDotGroup';

const META = {
  title: 'UI/MidDotGroup',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Элементы через точку и прочерк',
  render: () => (
    <Stack p="md" maw={320}>
      <MidDotGroup text items={['Манга', '1989', '374 гл.']} />
      <MidDotGroup
        truncate
        text
        items={['Гл. 120', 'Очень длинное название главы, которое не помещается в строку']}
      />
      <Group gap={4} fz="sm">
        <Text inherit>Рейтинг:</Text>
        <Mdash c="dimmed" />
      </Group>
    </Stack>
  ),
};
