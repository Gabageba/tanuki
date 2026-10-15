import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import PrivacyPolicy from '.';

const ROUTE: StoryRoute = {
  path: ROUTE_PATHS.PRIVACY_POLICY,
  url: ROUTE_PATHS.PRIVACY_POLICY,
  layout: STORY_LAYOUT.AUTH,
};

const META = {
  title: 'Страницы входа/Конфиденциальность',
  render: () => <PrivacyPolicy />,
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
