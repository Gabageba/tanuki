import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { BOOKMARK_ITEM } from '@/shared/storybook/fixtures';
import { clickFirstButton } from '@/shared/storybook/play';
import BookmarkActionsMenu from './BookmarkActionsMenu';

const META = {
  title: 'Меню/BookmarkActionsMenu',
  render: () => (
    <Box p="md">
      <BookmarkActionsMenu bookmark={BOOKMARK_ITEM} />
    </Box>
  ),
  play: clickFirstButton,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Меню карточки закладки',
};
