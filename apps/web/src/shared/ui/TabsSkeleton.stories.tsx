import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, Stack } from '@mantine/core';
import TabsSkeleton from './TabsSkeleton';

const META = {
  title: 'UI/TabsSkeleton',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Вкладки с кнопками и без',
  render: () => (
    <Stack p="md" gap="xl">
      <TabsSkeleton widths={[96, 120, 80, 112]} />
      <TabsSkeleton
        widths={[76, 100, 84]}
        actions={[0, 1].map((index) => (
          <Skeleton key={index} h={28} w={28} />
        ))}
      />
    </Stack>
  ),
};
