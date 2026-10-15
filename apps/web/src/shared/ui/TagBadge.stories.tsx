import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group } from '@mantine/core';
import { TITLE } from '@/shared/storybook/titles';
import TagBadge from './TagBadge';

const META = {
  title: 'UI/TagBadge',
  render: () => (
    <Group gap={6} p="md" maw={420}>
      {TITLE.tags.map(({ id, title }) => (
        <TagBadge key={id}>{title}</TagBadge>
      ))}
    </Group>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Теги тайтла' };
