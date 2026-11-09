import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { MOBILE_GLOBALS, STORY_LAYOUT, type StoryRoute } from '@/shared/storybook/models';
import PlaygroundHomeNewChapters from '.';

const ROUTE: StoryRoute = {
  path: `${ROUTE_PATHS.PLAYGROUND}/*`,
  url: `${ROUTE_PATHS.PLAYGROUND}/home-new-chapters`,
  layout: STORY_LAYOUT.PLAYGROUND,
};

const META = {
  title: 'Страницы/Песочница/Карточки новых глав на главной',
  component: PlaygroundHomeNewChapters,
  parameters: { route: ROUTE },
} satisfies Meta<typeof PlaygroundHomeNewChapters>;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Обычная' };
export const Mobile: Story = { name: 'На телефоне', globals: MOBILE_GLOBALS };
