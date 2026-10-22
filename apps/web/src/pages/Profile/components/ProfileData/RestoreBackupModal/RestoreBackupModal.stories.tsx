import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import { I18N } from '@/shared/lib/i18n';
import {
  BACKUP,
  NO_CONFLICTS_BACKUP_PREVIEW,
  NOTHING_NEW_BACKUP_PREVIEW,
} from '@/shared/storybook/account';
import { apiPath } from '@/shared/storybook/handlers';
import ModalStage from '@/shared/storybook/ModalStage';
import RestoreBackupModal from '.';

const BACKUP_FILE = new File([JSON.stringify(BACKUP)], 'tanuki-backup-2026-10-12.json', {
  type: 'application/json',
});
const FOREIGN_FILE = new File([JSON.stringify({ bookmarks: [] })], 'bookmarks-export.json', {
  type: 'application/json',
});

const clickButton = async (name: string) => {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

/** Выбирает файл в поле шага «Файл» и жмёт «Далее». */
const submitFile = async (file: File) => {
  const input = await waitFor(() => {
    const element = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!element) throw new Error('Поле файла ещё не появилось');
    return element;
  });
  await userEvent.upload(input, file);
  await clickButton(I18N.t('next'));
};

const previewHandler = (preview: typeof NO_CONFLICTS_BACKUP_PREVIEW) =>
  http.post(apiPath('/backup/preview'), () => HttpResponse.json(preview));

const META = {
  title: 'Модалки/Профиль/RestoreBackupModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => <RestoreBackupModal opened={opened} onClose={close} />}
    </ModalStage>
  ),
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const FileStep: Story = {
  name: 'Шаг 1: файл',
};

export const FileError: Story = {
  name: 'Шаг 1: чужой файл',
  play: () => submitFile(FOREIGN_FILE),
};

export const SummaryWithoutConflicts: Story = {
  name: 'Шаг 2: сводка без конфликтов',
  parameters: { msw: [previewHandler(NO_CONFLICTS_BACKUP_PREVIEW)] },
  play: () => submitFile(BACKUP_FILE),
};

export const SummaryWithConflicts: Story = {
  name: 'Шаг 2: сводка с конфликтами',
  play: () => submitFile(BACKUP_FILE),
};

export const QuestionsStep: Story = {
  name: 'Шаг 3: вопросы',
  play: async () => {
    await submitFile(BACKUP_FILE);
    // «Далее» есть и на шаге файла — ждём сводку, чтобы нажать уже её кнопку.
    await screen.findByText(I18N.t('whatsInBackup'));
    await clickButton(I18N.t('next'));
  },
};

export const NothingNew: Story = {
  name: 'Всё из копии уже есть',
  parameters: { msw: [previewHandler(NOTHING_NEW_BACKUP_PREVIEW)] },
  play: () => submitFile(BACKUP_FILE),
};

export const DoneStep: Story = {
  name: 'Готово с пропущенным',
  parameters: { msw: [previewHandler(NO_CONFLICTS_BACKUP_PREVIEW)] },
  play: async () => {
    await submitFile(BACKUP_FILE);
    await clickButton(I18N.t('recover'));
  },
};
