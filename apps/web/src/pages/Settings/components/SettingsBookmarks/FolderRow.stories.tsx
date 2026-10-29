import type { Meta, StoryObj } from '@storybook/react-vite';
import { Paper } from '@mantine/core';
import { fn, screen, userEvent } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import { CUSTOM_FOLDER, FAVORITE_FOLDER, PLANNED_FOLDER } from '@/shared/storybook/fixtures';
import FolderRow from './FolderRow';

const META = {
  title: 'Меню/FolderRow',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Custom: Story = {
  name: 'Своя папка: меню действий',
  render: () => (
    <Paper withBorder m="md" maw={560}>
      <FolderRow
        folder={CUSTOM_FOLDER}
        onRename={fn().mockName('onRename')}
        onDelete={fn().mockName('onDelete')}
      />
    </Paper>
  ),
  play: async () =>
    userEvent.click(await screen.findByRole('button', { name: I18N.t('folderActions') })),
};

export const BuiltIn: Story = {
  name: 'Встроенная папка',
  render: () => (
    <Paper withBorder m="md" maw={560}>
      <FolderRow
        folder={PLANNED_FOLDER}
        onRename={fn().mockName('onRename')}
        onDelete={fn().mockName('onDelete')}
      />
    </Paper>
  ),
};

export const Favorite: Story = {
  name: 'Системная папка «Любимое»',
  render: () => (
    <Paper withBorder m="md" maw={560}>
      <FolderRow
        folder={FAVORITE_FOLDER}
        onRename={fn().mockName('onRename')}
        onDelete={fn().mockName('onDelete')}
      />
    </Paper>
  ),
};
