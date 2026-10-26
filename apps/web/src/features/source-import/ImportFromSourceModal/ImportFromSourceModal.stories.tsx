import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import type { SourceImportPreview } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import {
  EMPTY_SOURCE_IMPORT_PREVIEW,
  NOTHING_NEW_SOURCE_IMPORT_PREVIEW,
  REPEAT_SOURCE_IMPORT_PREVIEW,
} from '@/shared/storybook/account';
import { apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import ImportFromSourceModal from '.';

const clickButton = async (name: string) => {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

/** Источник выбирается сам, когда список загрузился: до этого кнопка покажет ошибку под ним. */
const findBookmarks = async () => {
  await screen.findByRole('radio', { checked: true });
  await clickButton(I18N.t('findBookmarks'));
};

/** Шаг «Папки» — после чтения закладок. */
const openFolders = async () => {
  await findBookmarks();
  await screen.findByText(I18N.t('foldersOn', { source: 'ReadManga' }));
};

const previewHandler = (preview: SourceImportPreview) =>
  http.post(apiPath('/source-import/preview'), () => HttpResponse.json(preview));

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
  parameters: {
    msw: [
      http.post(apiPath('/source-import/preview'), async () => {
        await delay('infinite');
      }),
    ],
  },
  play: findBookmarks,
};

export const FoldersStep: Story = {
  name: 'Шаг 3: папки',
  play: openFolders,
};

export const FoldersRepeat: Story = {
  name: 'Шаг 3: повторный импорт',
  parameters: { msw: [previewHandler(REPEAT_SOURCE_IMPORT_PREVIEW)] },
  play: openFolders,
};

export const FoldersNothingNew: Story = {
  name: 'Шаг 3: нового нет',
  parameters: { msw: [previewHandler(NOTHING_NEW_SOURCE_IMPORT_PREVIEW)] },
  play: openFolders,
};

export const FoldersEmpty: Story = {
  name: 'Шаг 3: на сайте закладок нет',
  parameters: { msw: [previewHandler(EMPTY_SOURCE_IMPORT_PREVIEW)] },
  play: async () => {
    await findBookmarks();
    await screen.findByText(I18N.t('noBookmarksOnSource', { source: 'ReadManga' }));
  },
};

export const QuestionsStep: Story = {
  name: 'Шаг 4: вопросы',
  play: async () => {
    await openFolders();
    await clickButton(I18N.t('next'));
  },
};

export const DoneStep: Story = {
  name: 'Шаг 5: готово',
  parameters: { msw: [previewHandler(REPEAT_SOURCE_IMPORT_PREVIEW)] },
  play: async () => {
    await openFolders();
    await clickButton(I18N.t('import'));
  },
};
