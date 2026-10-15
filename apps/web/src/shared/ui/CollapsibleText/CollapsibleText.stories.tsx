import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
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

export const Skeleton: Story = {
  name: 'Скелетон',
  render: () => (
    <Box p="md" maw={420}>
      <CollapsibleTextSkeleton lines={3} />
    </Box>
  ),
};
