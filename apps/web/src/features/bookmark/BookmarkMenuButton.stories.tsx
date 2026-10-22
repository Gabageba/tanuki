import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { http, HttpResponse } from 'msw';
import type { TitleBookmark } from '@tanuki/contracts';
import { apiPath } from '@/shared/storybook/handlers';
import { clickFirstButton } from '@/shared/storybook/play';
import { TITLE } from '@/shared/storybook/titles';
import BookmarkMenuButton from './BookmarkMenuButton';

const META = {
  title: 'Меню/BookmarkMenuButton',
  render: () => (
    <Box p="md" w={280}>
      <BookmarkMenuButton titleId={TITLE.id} />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const InFolder: Story = {
  name: 'В папке «Читаю»',
};

export const NotBookmarked: Story = {
  name: 'Не в закладках',
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId/bookmark'), () =>
        HttpResponse.json({ folderId: null, conflict: null } satisfies TitleBookmark),
      ),
    ],
  },
};
