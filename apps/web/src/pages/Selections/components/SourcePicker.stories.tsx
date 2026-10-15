import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { fn } from 'storybook/test';
import { SOURCES } from '@/shared/storybook/fixtures';
import { clickFirstButton } from '@/shared/storybook/play';
import { SELECTIONS_SOURCE_IDS } from '@/shared/storybook/titles';
import SourcePicker from './SourcePicker';

const SELECTIONS_SOURCES = SOURCES.filter(({ id }) => SELECTIONS_SOURCE_IDS.includes(id));

const META = {
  title: 'Меню/SourcePicker',
  render: () => (
    <Box p="md">
      <SourcePicker
        sources={SELECTIONS_SOURCES}
        active={SELECTIONS_SOURCES[0]!}
        onChange={fn().mockName('onChange')}
      />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Выбор источника подборок',
};
