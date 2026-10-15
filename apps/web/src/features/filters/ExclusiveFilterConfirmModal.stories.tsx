import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ModalStage from '@/shared/storybook/ModalStage';
import ExclusiveFilterConfirmModal from './ExclusiveFilterConfirmModal';

const META = {
  title: 'Модалки/Фильтры/ExclusiveFilterConfirmModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const WithGroup: Story = {
  name: 'С названием группы',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <ExclusiveFilterConfirmModal
          opened={opened}
          groupTitle="Жанры"
          onConfirm={fn().mockName('onConfirm')}
          onCancel={close}
        />
      )}
    </ModalStage>
  ),
};

export const WithoutGroup: Story = {
  name: 'Без группы',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <ExclusiveFilterConfirmModal
          opened={opened}
          groupTitle={undefined}
          onConfirm={fn().mockName('onConfirm')}
          onCancel={close}
        />
      )}
    </ModalStage>
  ),
};
