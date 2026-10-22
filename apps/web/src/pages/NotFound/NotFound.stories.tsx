import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import NotFound from '.';

const ROUTE: StoryRoute = {
  path: '*',
  url: '/nowhere',
  layout: STORY_LAYOUT.APP,
};

const META = {
  title: 'Страницы/404',
  render: () => <NotFound />,
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
