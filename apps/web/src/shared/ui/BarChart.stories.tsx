import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import BarChart from './BarChart';

const WEEK = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const COUNTS = [5, 8, 0, 12, 3, 9, 6];

const items = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: String(index),
    value: COUNTS[index % COUNTS.length]!,
    label: WEEK[index % WEEK.length]!,
    tooltip: { title: `День ${index + 1}`, value: `${COUNTS[index % COUNTS.length]} гл.` },
  }));

const META = {
  title: 'UI/BarChart',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Week: Story = {
  name: 'Неделя, сегодня выделено',
  render: () => (
    <Box p="md" w={420}>
      <BarChart items={items(7)} highlightedIndex={6} />
    </Box>
  ),
};

export const Month: Story = {
  name: '30 столбиков — подписи через шаг',
  render: () => (
    <Box p="md" w={640}>
      <BarChart items={items(30)} highlightedIndex={29} labelStep={7} />
    </Box>
  ),
};

export const Empty: Story = {
  name: 'Все нули',
  render: () => (
    <Box p="md" w={420}>
      <BarChart items={items(7).map((item) => ({ ...item, value: 0 }))} />
    </Box>
  ),
};
