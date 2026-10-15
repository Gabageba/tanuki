import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import ProgressList from './ProgressList';

const ITEMS = [
  { key: 'reading', label: 'Читаю', value: 12, text: 12 },
  { key: 'planned', label: 'В планах', value: 27, text: 27 },
  { key: 'completed', label: 'Прочитано', value: 8, text: 8 },
  { key: 'dropped', label: 'Брошено', value: 2, text: 2 },
];

const META = {
  title: 'UI/ProgressList',
  render: () => (
    <Box p="md" maw={420}>
      <ProgressList gap="sm" items={ITEMS} highlightedIndex={1} />
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Полоски с выделенной' };
