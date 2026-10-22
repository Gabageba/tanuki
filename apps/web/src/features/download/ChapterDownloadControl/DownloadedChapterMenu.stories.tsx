import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { clickFirstButton } from '@/shared/storybook/play';
import DownloadedChapterMenu from './DownloadedChapterMenu';

const META = {
  title: 'Меню/DownloadedChapterMenu',
  render: () => (
    <Box p="md">
      <DownloadedChapterMenu onDelete={() => undefined} />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню скачанной главы',
};
