import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import SkeletonCompare from '@/shared/storybook/SkeletonCompare';
import { TITLE } from '@/shared/storybook/titles';
import CollapsibleTextSkeleton from './CollapsibleTextSkeleton';
import CollapsibleText from '.';

const META = {
  title: 'UI/CollapsibleText',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Clamped: Story = {
  name: 'Длинный текст',
  render: () => (
    <Box p="md" maw={420}>
      <CollapsibleText lineClamp={3}>{TITLE.description}</CollapsibleText>
    </Box>
  ),
};

export const Short: Story = {
  name: 'Короткий — без кнопки',
  render: () => (
    <Box p="md" maw={420}>
      <CollapsibleText lineClamp={3}>Короткое описание.</CollapsibleText>
    </Box>
  ),
};

export const WithSkeleton: Story = {
  name: 'Рядом со скелетоном',
  render: () => (
    <SkeletonCompare
      w={420}
      item={<CollapsibleText lineClamp={3}>{TITLE.description}</CollapsibleText>}
      skeleton={<CollapsibleTextSkeleton lines={3} />}
    />
  ),
};
