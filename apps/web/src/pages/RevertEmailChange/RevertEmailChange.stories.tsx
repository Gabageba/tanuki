import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { apiError, apiPath, neverResolve } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import RevertEmailChange from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.REVERT_EMAIL_CHANGE,
  url: `${ROUTE_PATHS.REVERT_EMAIL_CHANGE}?token=storybook`,
  layout: STORY_LAYOUT.AUTH,
};

const REVERT_PATH = apiPath('/account/email/revert');

// Своего экрана успеха у страницы нет: тост и сразу переход дальше, которого в истории нет.
// Поэтому смотреть здесь можно только проверку ссылки и ответ, что ссылка не годится.
const META = {
  title: 'Страницы входа/Отмена смены почты',
  render: () => <RevertEmailChange />,
  parameters: {
    route: ROUTE,
    msw: [
      http.post(REVERT_PATH, () =>
        apiError(API_ERROR_CODE.TOKEN_INVALID, 'Ссылка устарела или уже использована'),
      ),
    ],
  },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Ссылка устарела',
};

export const Mobile: Story = {
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

export const Verifying: Story = {
  name: 'Проверка',
  parameters: { msw: [http.post(REVERT_PATH, neverResolve)] },
};
