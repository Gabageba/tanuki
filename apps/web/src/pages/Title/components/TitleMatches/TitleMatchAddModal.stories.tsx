import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, screen, userEvent } from 'storybook/test';
import ModalStage from '@/shared/storybook/ModalStage';
import TitleMatchAddModal from './TitleMatchAddModal';

const META = {
  title: 'Модалки/Тайтл/TitleMatchAddModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <TitleMatchAddModal
          opened={opened}
          onClose={close}
          mutateTitleLink={fn().mockName('mutateTitleLink')}
          isTitleLinkPending={false}
        />
      )}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Пустое поле',
};

export const InvalidLink: Story = {
  name: 'Не ссылка на тайтл',
  play: async () => {
    await userEvent.type(await screen.findByRole('textbox'), 'https://example.com/manga');
  },
};
