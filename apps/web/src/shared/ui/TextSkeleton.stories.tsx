import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '@mantine/core';
import TextSkeleton from './TextSkeleton';

const META = {
  title: 'UI/TextSkeleton',
  render: () => (
    <Stack p="md" w={360}>
      <TextSkeleton fz={24} w="60%" />
      <TextSkeleton fz="sm" lines={3} lastLineWidth="40%" />
    </Stack>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Заголовок и абзац' };
