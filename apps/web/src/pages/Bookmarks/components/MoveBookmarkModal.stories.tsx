import type { Meta, StoryObj } from '@storybook/react-vite';
import { BOOKMARK_ITEM } from '@/shared/storybook/fixtures';
import ModalStage from '@/shared/storybook/ModalStage';
import MoveBookmarkModal from './MoveBookmarkModal';

const META = {
  title: 'Модалки/Закладки/MoveBookmarkModal',
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const WithOtherSources: Story = {
  name: 'С копиями на других источниках',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <MoveBookmarkModal bookmark={BOOKMARK_ITEM} opened={opened} onClose={close} />
      )}
    </ModalStage>
  ),
};

export const SingleSource: Story = {
  name: 'Один источник',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <MoveBookmarkModal
          bookmark={{ ...BOOKMARK_ITEM, otherSources: [] }}
          opened={opened}
          onClose={close}
        />
      )}
    </ModalStage>
  ),
};
