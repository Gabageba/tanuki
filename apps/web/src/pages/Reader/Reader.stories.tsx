import type { Meta, StoryObj } from '@storybook/react-vite';
import { generatePath } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import { READING_CHAPTER, TITLE } from '@/shared/storybook/titles';
import Reader from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.READER,
  url: generatePath(ROUTE_PATHS.READER, { titleId: TITLE.id, chapterId: READING_CHAPTER.id }),
  layout: STORY_LAYOUT.NONE,
};

const META = {
  title: 'Страницы/Читалка',
  render: () => <Reader />,
  parameters: { route: ROUTE },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Обычная',
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

export const Loading: Story = {
  name: 'Загрузка',
  parameters: { msw: LOADING_HANDLERS },
};

export const ServerError: Story = {
  name: 'Ошибка сервера',
  parameters: { msw: ERROR_HANDLERS },
};
