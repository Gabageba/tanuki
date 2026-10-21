import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import { TITLES } from '@/shared/storybook/titles';
import TitleCardsGrid from './TitleCardsGrid';

const META = {
  title: 'Карточки/TitleCardsGrid',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Grid: Story = {
  name: 'Плитки',
  render: () => (
    <Box p="md">
      <TitleCardsGrid titles={TITLES} viewMode={VIEW_MODE.GRID} />
    </Box>
  ),
};

export const List: Story = {
  name: 'Список',
  render: () => (
    <Box p="md">
      <TitleCardsGrid titles={TITLES} viewMode={VIEW_MODE.LIST} />
    </Box>
  ),
};
