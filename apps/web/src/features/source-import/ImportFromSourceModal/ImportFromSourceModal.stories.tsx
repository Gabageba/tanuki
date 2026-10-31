import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import type { SourceImportPreview } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import {
  EMPTY_SOURCE_IMPORT_PREVIEW,
  MANY_FOLDERS_SOURCE_IMPORT_PREVIEW,
  NOTHING_NEW_SOURCE_IMPORT_PREVIEW,
  OTHER_FOLDER_SOURCE_IMPORT_PREVIEW,
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

/** Выбираем источник сводки явно: первый доступный источник может быть другим. */
const findBookmarks = async () => {
  await screen.findByRole('radio', { checked: true });
  await userEvent.click(screen.getByRole('radio', { name: /ReadManga/ }));
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

export const FoldersMany: Story = {
  name: 'Шаг 3: много папок',
  parameters: { msw: [previewHandler(MANY_FOLDERS_SOURCE_IMPORT_PREVIEW)] },
  play: openFolders,
};

export const FoldersNothingNew: Story = {
  name: 'Шаг 3: нового нет',
  parameters: { msw: [previewHandler(NOTHING_NEW_SOURCE_IMPORT_PREVIEW)] },
  play: async () => {
    await findBookmarks();
    await screen.findByText(I18N.t('nothingNewAllInBookmarks', { source: 'ReadManga' }));
  },
};

export const FoldersOtherFolder: Story = {
  name: 'Шаг 3: всё уже есть, один тайтл в другой папке',
  parameters: { msw: [previewHandler(OTHER_FOLDER_SOURCE_IMPORT_PREVIEW)] },
  play: async () => {
    await openFolders();
    const folder = screen.getByRole('checkbox', {
      name: OTHER_FOLDER_SOURCE_IMPORT_PREVIEW.folders[0]!.name,
    });
    await expect(folder).toBeChecked();
    await expect(folder).toBeEnabled();
    await expect(screen.getByText(I18N.t('countInOtherFolder', { count: 1 }))).toBeVisible();
    await userEvent.click(folder);
    await expect(folder).not.toBeChecked();
    await expect(screen.queryByRole('button', { name: I18N.t('next') })).not.toBeInTheDocument();
    await userEvent.click(folder);
    await clickButton(I18N.t('next'));
    await expect(
      screen.getByText(I18N.t('titlesInBookmarksInOtherFolder', { count: 1 })),
    ).toBeVisible();
    // Кнопка возврата в заголовке — первая кнопка диалога, без текстовой подписи.
    await userEvent.click(within(screen.getByRole('dialog')).getAllByRole('button')[0]!);
    await expect(screen.getByText(I18N.t('countInOtherFolder', { count: 1 }))).toBeVisible();
  },
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
