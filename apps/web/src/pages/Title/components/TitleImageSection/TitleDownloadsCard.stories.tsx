import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import {
  TITLE_DOWNLOADED_SEED,
  TITLE_DOWNLOADING_SEED,
  TITLE_FAILED_SEED,
  TITLE_PAUSED_SEED,
} from '@/shared/storybook/downloads';
import { TITLE } from '@/shared/storybook/titles';
import TitleDownloadsCard from './TitleDownloadsCard';

const META = {
  title: 'Карточки/TitleDownloadsCard',
  // Ширина колонки обложки на странице тайтла.
  render: () => (
    <Box p="md" w={280}>
      <TitleDownloadsCard titleId={TITLE.id} />
    </Box>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Downloading: Story = {
  name: 'Качается',
  parameters: { offlineDb: TITLE_DOWNLOADING_SEED },
};

export const Paused: Story = {
  name: 'На паузе',
  parameters: { offlineDb: TITLE_PAUSED_SEED },
};

export const Failed: Story = {
  name: 'Ошибка',
  parameters: { offlineDb: TITLE_FAILED_SEED },
};

export const Downloaded: Story = {
  name: 'Скачано',
  parameters: { offlineDb: TITLE_DOWNLOADED_SEED },
};
