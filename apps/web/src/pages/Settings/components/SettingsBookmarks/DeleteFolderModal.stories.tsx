import type { Meta, StoryObj } from '@storybook/react-vite';
import { CUSTOM_FOLDER, PLANNED_FOLDER } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import DeleteFolderModal from './DeleteFolderModal';

const META = {
  title: 'Модалки/Закладки/DeleteFolderModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const WithTitles: Story = {
  name: 'С тайтлами',
  render: () => (
    <ModalStage>
      {({ opened, close }) =>
        opened && (
          <DeleteFolderModal
            folder={CUSTOM_FOLDER}
            folders={[PLANNED_FOLDER, CUSTOM_FOLDER]}
            onClose={close}
          />
        )
      }
    </ModalStage>
  ),
};

export const Empty: Story = {
  name: 'Пустая',
  render: () => (
    <ModalStage>
      {({ opened, close }) =>
        opened && (
          <DeleteFolderModal
            folder={{ ...CUSTOM_FOLDER, count: 0, newCount: 0 }}
            folders={[PLANNED_FOLDER, CUSTOM_FOLDER]}
            onClose={close}
          />
        )
      }
    </ModalStage>
  ),
};
