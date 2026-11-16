import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { API_ERROR_CODE, TITLE_LINK_VERDICT, USER_ROLE } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { CURRENT_USER, FOLDER_ID } from '@/shared/storybook/fixtures';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import { MOBILE_GLOBALS } from '@/shared/storybook/models';
import { TITLE, TITLE_MATCHES_RESPONSE } from '@/shared/storybook/titles';
import TitleMatches from '.';
import { clickEnabledButton } from '@/shared/storybook/play';
import {
  CONFLICT_HANDLERS,
  LINK_REQUESTS,
  createLinksHandler,
  enterChecking,
  expectSavedSelection,
  expectSelection,
  selectMatches,
} from '@/shared/storybook/titleLinks';

const META = {
  title: 'Модалки/Тайтл/TitleMatches',
  render: () => (
    <Box p="md" maw={912}>
      <TitleMatches title={TITLE} />
    </Box>
  ),
  beforeEach: () => {
    LINK_REQUESTS.mockClear();
  },
  parameters: { msw: [createLinksHandler()] },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = { name: 'Обычный просмотр' };

export const Checking: Story = {
  name: 'Режим без выбора',
  play: async () => {
    await enterChecking();
    expect(screen.queryByRole('button', { name: I18N.t('confirmLinks') })).not.toBeInTheDocument();
  },
};

export const Selected: Story = {
  name: 'Выбраны карточки',
  play: async () => selectMatches(),
};

export const Mobile: Story = {
  ...Selected,
  name: 'На телефоне',
  globals: MOBILE_GLOBALS,
};

export const SelectionAndExit: Story = {
  name: 'Выбор, снятие и выход с клавиатуры',
  play: async () => {
    await enterChecking();
    const checkbox = screen.getAllByRole('checkbox')[0]!;
    checkbox.focus();
    await userEvent.keyboard(' ');
    await expectSelection(1);
    await userEvent.keyboard(' ');
    expect(
      screen.queryByRole('button', { name: I18N.t('clearSelection') }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('clearSelection') }));
    expect(screen.queryByRole('button', { name: I18N.t('confirmLinks') })).not.toBeInTheDocument();
    await userEvent.click(checkbox);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('backToViewing') }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(LINK_REQUESTS).not.toHaveBeenCalled();
    await enterChecking();
    expect(screen.queryByRole('checkbox', { checked: true })).not.toBeInTheDocument();
  },
};

export const Confirmed: Story = {
  name: 'Массовое подтверждение',
  play: async () => {
    await selectMatches(3);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('confirmLinks') }));
    await expectSavedSelection();
    expect(LINK_REQUESTS.mock.calls.map(([body]) => body)).toEqual(
      TITLE_MATCHES_RESPONSE.items.map(({ title }) => ({
        targetId: title.id,
        verdict: TITLE_LINK_VERDICT.CONFIRMED,
      })),
    );
  },
};

export const Rejected: Story = {
  name: 'Массовое отклонение',
  play: async () => {
    await selectMatches(3);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('rejectLinks') }));
    await expectSavedSelection();
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(3);
    expect(
      LINK_REQUESTS.mock.calls.every(([body]) => body.verdict === TITLE_LINK_VERDICT.REJECTED),
    ).toBe(true);
  },
};

export const Saving: Story = {
  name: 'Сохранение',
  parameters: {
    msw: [
      createLinksHandler(async () => {
        await delay('infinite');
        return new HttpResponse(null, { status: 204 });
      }),
    ],
  },
  play: async () => {
    await selectMatches();
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('confirmLinks') }));
    await waitFor(() => expect(LINK_REQUESTS).toHaveBeenCalledTimes(1));
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeDisabled();
    for (const name of [
      I18N.t('backToViewing'),
      I18N.t('clearSelection'),
      I18N.t('rejectLinks'),
      I18N.t('addManually'),
    ]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  },
};

export const PartialFailure: Story = {
  name: 'Частичное сохранение и повтор',
  parameters: {
    msw: [
      createLinksHandler((_body, index) =>
        index === 2
          ? apiError(API_ERROR_CODE.INTERNAL, 'Не удалось сохранить связь', 500)
          : new HttpResponse(null, { status: 204 }),
      ),
    ],
  },
  play: async () => {
    await selectMatches(3);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('confirmLinks') }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: I18N.t('backToViewing') })).toBeEnabled(),
    );
    await expectSelection(2);
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(2);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('confirmLinks') }));
    await expectSavedSelection();
    expect(LINK_REQUESTS.mock.calls.map(([body]) => body.targetId)).toEqual([
      TITLE_MATCHES_RESPONSE.items[0]!.title.id,
      TITLE_MATCHES_RESPONSE.items[1]!.title.id,
      TITLE_MATCHES_RESPONSE.items[1]!.title.id,
      TITLE_MATCHES_RESPONSE.items[2]!.title.id,
    ]);
  },
};

export const BookmarkConflict: Story = {
  name: 'Конфликт папок закладок',
  parameters: { msw: CONFLICT_HANDLERS },
  play: async () => {
    await selectMatches(3);
    await clickEnabledButton(screen.getByRole('button', { name: I18N.t('confirmLinks') }));
    await screen.findByRole('dialog', { name: I18N.t('folderForBookmark') });
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(2);
  },
};

export const ResolveBookmarkConflict: Story = {
  name: 'Выбор папки продолжает очередь',
  parameters: { msw: CONFLICT_HANDLERS },
  play: async (context) => {
    await BookmarkConflict.play!(context);
    const dialog = within(screen.getByRole('dialog', { name: I18N.t('folderForBookmark') }));
    const options = await dialog.findAllByRole('radio');
    await userEvent.click(options[1]!);
    await clickEnabledButton(dialog.getByRole('button', { name: I18N.t('link') }));
    await expectSavedSelection();
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(4);
    expect(LINK_REQUESTS.mock.calls[2]![0]).toEqual({
      targetId: TITLE_MATCHES_RESPONSE.items[1]!.title.id,
      verdict: TITLE_LINK_VERDICT.CONFIRMED,
      bookmarkFolderId: FOLDER_ID.PLANNED,
    });
    expect(LINK_REQUESTS.mock.calls[3]![0].targetId).toBe(
      TITLE_MATCHES_RESPONSE.items[2]!.title.id,
    );
  },
};

export const CancelBookmarkConflict: Story = {
  name: 'Отмена конфликта сохраняет оставшийся выбор',
  parameters: { msw: CONFLICT_HANDLERS },
  play: async (context) => {
    await BookmarkConflict.play!(context);
    const dialog = within(screen.getByRole('dialog', { name: I18N.t('folderForBookmark') }));
    await clickEnabledButton(dialog.getByRole('button', { name: I18N.t('cancel') }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: I18N.t('backToViewing') })).toBeEnabled(),
    );
    await expectSelection(2);
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(2);
  },
};

export const ConflictLoading: Story = {
  name: 'Загрузка закладок при конфликте',
  parameters: {
    msw: [
      CONFLICT_HANDLERS[0]!,
      http.get(apiPath('/titles/:titleId/bookmark'), () => delay('infinite')),
    ],
  },
  play: BookmarkConflict.play,
};

export const ConflictLoadFailure: Story = {
  name: 'Ошибка загрузки закладок позволяет отменить очередь',
  parameters: {
    msw: [
      CONFLICT_HANDLERS[0]!,
      http.get(apiPath('/titles/:titleId/bookmark'), () =>
        apiError(API_ERROR_CODE.INTERNAL, 'Не удалось загрузить закладки', 500),
      ),
    ],
  },
  play: CancelBookmarkConflict.play,
};

export const ManualLink: Story = {
  name: 'Добавление вручную',
  play: async () => {
    const button = await screen.findByRole('button', { name: I18N.t('addManually') });
    await clickEnabledButton(button);
    const dialog = within(await screen.findByRole('dialog', { name: I18N.t('addTitleManually') }));
    await userEvent.type(
      dialog.getByRole('textbox'),
      `/title/${TITLE_MATCHES_RESPONSE.items[0]!.title.id}`,
    );
    await clickEnabledButton(dialog.getByRole('button', { name: I18N.t('add') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(LINK_REQUESTS).toHaveBeenCalledWith({
      targetId: TITLE_MATCHES_RESPONSE.items[0]!.title.id,
      verdict: TITLE_LINK_VERDICT.CONFIRMED,
    });
  },
};

export const ManualBookmarkConflict: Story = {
  name: 'Конфликт папок при добавлении вручную',
  parameters: { msw: CONFLICT_HANDLERS },
  play: async () => {
    const button = await screen.findByRole('button', { name: I18N.t('addManually') });
    await clickEnabledButton(button);
    const manual = within(await screen.findByRole('dialog', { name: I18N.t('addTitleManually') }));
    await userEvent.type(
      manual.getByRole('textbox'),
      `/title/${TITLE_MATCHES_RESPONSE.items[1]!.title.id}`,
    );
    await clickEnabledButton(manual.getByRole('button', { name: I18N.t('add') }));
    const conflict = within(
      await screen.findByRole('dialog', { name: I18N.t('folderForBookmark') }),
    );
    await conflict.findAllByRole('radio');
    await clickEnabledButton(conflict.getByRole('button', { name: I18N.t('link') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(LINK_REQUESTS).toHaveBeenCalledTimes(2);
    expect(LINK_REQUESTS.mock.calls[1]![0].bookmarkFolderId).toBe(FOLDER_ID.READING);
  },
};

export const Empty: Story = {
  name: 'Пусто',
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId/matches'), () =>
        HttpResponse.json({ items: [], failures: [] }),
      ),
    ],
  },
};

export const Loading: Story = {
  name: 'Загрузка',
  parameters: {
    msw: [http.get(apiPath('/titles/:titleId/matches'), () => delay('infinite'))],
  },
};

export const ServerError: Story = {
  name: 'Ошибка загрузки совпадений',
  parameters: {
    msw: [
      http.get(apiPath('/titles/:titleId/matches'), () =>
        apiError(API_ERROR_CODE.INTERNAL, 'Не удалось загрузить совпадения', 500),
      ),
    ],
  },
};

export const RegularUser: Story = {
  name: 'Обычный пользователь',
  parameters: {
    msw: [
      http.get(apiPath('/auth/me'), () =>
        HttpResponse.json({ ...CURRENT_USER, role: USER_ROLE.USER }),
      ),
    ],
  },
};
