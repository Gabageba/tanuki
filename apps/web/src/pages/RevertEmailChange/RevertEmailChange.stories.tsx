import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import RevertEmailChange from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.REVERT_EMAIL_CHANGE,
  url: `${ROUTE_PATHS.REVERT_EMAIL_CHANGE}?token=storybook`,
  layout: STORY_LAYOUT.AUTH,
};

const META = {
  title: 'Страницы входа/Отмена смены почты',
  render: () => <RevertEmailChange />,
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
