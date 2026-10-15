import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import TagBadge from '@/shared/ui/TagBadge';
import { TITLE } from '@/shared/storybook/titles';
import CollapsibleGroupSkeleton from './CollapsibleGroupSkeleton';
import CollapsibleGroup from '.';

const TAGS = [...TITLE.tags, ...TITLE.tags, ...TITLE.tags].map(({ title }, index) => (
  <TagBadge key={index}>{title}</TagBadge>
));

const META = {
  title: 'UI/CollapsibleGroup',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Clamped: Story = {
  name: 'Свёрнуто до двух строк',
  render: () => (
    <Box p="md" maw={420}>
      <CollapsibleGroup gap={6} maxRows={2}>
        {TAGS}
      </CollapsibleGroup>
    </Box>
  ),
};

export const Skeleton: Story = {
  name: 'Скелетон',
  render: () => (
    <Box p="md" maw={420}>
      <CollapsibleGroupSkeleton groupHeight={22} />
    </Box>
  ),
};
