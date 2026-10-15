import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiPath } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import Register from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.REGISTER,
  url: `${ROUTE_PATHS.REGISTER}?invite=k7Qm2xVn9RtP`,
  layout: STORY_LAYOUT.AUTH,
};

const META = {
  title: 'Страницы входа/Регистрация',
  render: () => <Register />,
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

export const InvalidInvite: Story = {
  name: 'Приглашение недействительно',
  parameters: {
    msw: [http.get(apiPath('/auth/invites/:code'), () => HttpResponse.json({ valid: false }))],
  },
};

export const NoInvite: Story = {
  name: 'Без приглашения',
  parameters: { route: { ...ROUTE, url: ROUTE_PATHS.REGISTER } },
};
