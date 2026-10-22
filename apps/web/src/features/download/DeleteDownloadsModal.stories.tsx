import type { Meta, StoryObj } from '@storybook/react-vite';
import { DOWNLOADS_SEED } from '@/shared/storybook/downloads';
import ModalStage from '@/shared/storybook/ModalStage';
import { TITLE } from '@/shared/storybook/titles';
import DeleteDownloadsModal from './DeleteDownloadsModal';

const META = {
  title: 'Модалки/Загрузки/DeleteDownloadsModal',
  parameters: { offlineDb: DOWNLOADS_SEED },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const All: Story = {
  name: 'Всё скачанное',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <DeleteDownloadsModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
};

export const Title: Story = {
  name: 'Главы тайтла',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <DeleteDownloadsModal
          title={{ id: TITLE.id, name: TITLE.name }}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};
