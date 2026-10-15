import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FILTER_GROUPS } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import FilterDrawer from '.';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';

const META = {
  title: 'Дроверы/Каталог/FilterDrawer',
  // Drawer фильтров есть только на телефоне — на широком экране фильтры в панели.
  globals: MOBILE_GLOBALS,
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Группы',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <FilterDrawer
          groups={FILTER_GROUPS}
          selection={[
            { groupId: 'genres', key: 'genre-0' },
            { groupId: 'genres', key: 'genre-2', exclude: true },
          ]}
          opened={opened}
          onClose={close}
          onChange={fn().mockName('onChange')}
        />
      )}
    </ModalStage>
  ),
};
