import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import ModalStage from '@/shared/storybook/ModalStage';
import { MOCK_PARSING_DURATION_MS } from './models';
import ImportFromSourceModal from '.';

/** Кнопка активна, только когда источники загрузились и один выбран. */
const findBookmarks = async () => {
  const button = await screen.findByRole('button', { name: I18N.t('findBookmarks') });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

const META = {
  title: 'Модалки/Профиль/ImportFromSourceModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <ImportFromSourceModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const SourceStep: Story = {
  name: 'Шаг 1: источник',
};

export const ParsingStep: Story = {
  name: 'Шаг 2: чтение закладок',
  play: findBookmarks,
};

export const TitlesStep: Story = {
  name: 'Шаг 3: тайтлы',
  play: async () => {
    await findBookmarks();
    await screen.findByText(
      I18N.t('importDoesNotOverwriteProgress'),
      {},
      { timeout: MOCK_PARSING_DURATION_MS * 2 },
    );
  },
};
