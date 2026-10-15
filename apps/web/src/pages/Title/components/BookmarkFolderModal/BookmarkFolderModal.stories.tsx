import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderSimpleIcon } from '@phosphor-icons/react';
import { fn } from 'storybook/test';
import { FOLDER_ID } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import BookmarkFolderModal from '.';

const META = {
  title: 'Модалки/Тайтл/BookmarkFolderModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Conflict: Story = {
  name: 'Копии в разных папках',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <BookmarkFolderModal
          opened={opened}
          onClose={close}
          copies={[
            { folderId: FOLDER_ID.READING, sourceIds: ['readmanga_ru'] },
            { folderId: FOLDER_ID.PLANNED, sourceIds: ['mintmanga', 'seimanga'] },
          ]}
          message="Копии тайтла лежат в разных папках. Выберите одну — туда переедут все."
          hint="Прогресс чтения и сами закладки не потеряются."
          submitLabel="Перенести"
          submitIcon={<FolderSimpleIcon />}
          isPending={false}
          onSubmit={fn().mockName('onSubmit')}
        />
      )}
    </ModalStage>
  ),
};
