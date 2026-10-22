import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { clickFirstButton } from '@/shared/storybook/play';
import { TITLE } from '@/shared/storybook/titles';
import DownloadedTitleMenu from './DownloadedTitleMenu';

const META = {
  title: 'Меню/DownloadedTitleMenu',
  render: () => (
    <Box p="md">
      <DownloadedTitleMenu titleId={TITLE.id} name={TITLE.name} />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню скачанного тайтла',
};
