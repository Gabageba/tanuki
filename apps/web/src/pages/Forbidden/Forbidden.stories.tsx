import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Forbidden from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.MANAGEMENT,
  url: ROUTE_PATHS.MANAGEMENT,
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/403',
  render: () => <Forbidden />,
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
