import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { ERROR_HANDLERS, LOADING_HANDLERS } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import SourcesHealth from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.SOURCES_HEALTH,
  url: ROUTE_PATHS.SOURCES_HEALTH,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/Здоровье источников',
  render: () => <SourcesHealth />,
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
