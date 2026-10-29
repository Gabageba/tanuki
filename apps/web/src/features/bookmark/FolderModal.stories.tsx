import type { Meta, StoryObj } from '@storybook/react-vite';
import { http } from 'msw';
import { screen, userEvent } from 'storybook/test';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { CUSTOM_FOLDER } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import FolderModal from './FolderModal';

const META = {
  title: 'Модалки/Закладки/FolderModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Create: Story = {
  name: 'Новая папка',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <FolderModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};

export const Rename: Story = {
  name: 'Переименовать',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <FolderModal opened={opened} onClose={close} folder={CUSTOM_FOLDER} />
      )}
    </ModalStage>
  ),
};

export const NameTaken: Story = {
  name: 'Имя занято (ответ сервера)',
  parameters: {
    msw: [
      http.post(apiPath('/bookmark-folders'), () =>
        apiError(API_ERROR_CODE.BOOKMARK_FOLDER_NAME_TAKEN, 'Папка с таким названием уже есть'),
      ),
    ],
  },
  render: Create.render,
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText(I18N.t('title')), 'Манхва');
    await userEvent.click(screen.getByRole('button', { name: I18N.t('create') }));
  },
};
