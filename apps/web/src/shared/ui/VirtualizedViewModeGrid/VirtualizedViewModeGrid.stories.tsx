import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Paper, Text } from '@mantine/core';
import { VIEW_MODE } from '@/shared/lib/viewMode';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import VirtualizedViewModeGrid from './index';

const ITEMS = Array.from({ length: 500 }, (_, index) => (
  <Paper key={index} p="md" withBorder mih={120 + (index % 3) * 24}>
    <Text>Карточка {index + 1}</Text>
  </Paper>
));

const META = {
  title: 'UI/VirtualizedViewModeGrid',
  component: VirtualizedViewModeGrid,
  args: { viewMode: VIEW_MODE.GRID, children: ITEMS },
  render: (args) => (
    <Box p="md">
      <Text mb="md">500 карточек. Прокрутите страницу и измените ширину окна.</Text>
      <VirtualizedViewModeGrid {...args} />
    </Box>
  ),
} satisfies Meta<typeof VirtualizedViewModeGrid>;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = { name: 'Плитка' };
export const List: Story = { name: 'Список', args: { viewMode: VIEW_MODE.LIST } };
export const Coverless: Story = {
  name: 'Без обложек',
  args: { viewMode: VIEW_MODE.COVERLESS },
};
export const Mobile: Story = { name: 'На телефоне', globals: MOBILE_GLOBALS };
