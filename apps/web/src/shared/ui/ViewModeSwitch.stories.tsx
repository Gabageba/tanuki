import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Stack } from '@mantine/core';
import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { TITLES } from '@/shared/storybook/titles';
import ViewModeGrid from './ViewModeGrid';
import ViewModeSwitch from './ViewModeSwitch';

const META = {
  title: 'UI/ViewModeSwitch',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Переключатель и сетка',
  render: function Render() {
    const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
    return (
      <Stack p="md">
        <Box>
          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </Box>
        <ViewModeGrid viewMode={viewMode}>
          {TITLES.slice(0, 8).map((title) => (
            <SourceTitleCard key={title.id} title={title} viewMode={viewMode} />
          ))}
        </ViewModeGrid>
      </Stack>
    );
  },
};
