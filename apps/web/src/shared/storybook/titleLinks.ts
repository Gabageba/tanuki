import { http, HttpResponse } from 'msw';
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';
import { API_ERROR_CODE, type TitleLinkRequest } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { apiError, apiPath } from '@/shared/storybook/handlers';
import { clickEnabledButton } from '@/shared/storybook/play';
import { FOLDER_ID } from '@/shared/storybook/fixtures';
import { TITLE_MATCHES_RESPONSE } from '@/shared/storybook/titles';

export const LINK_REQUESTS = fn<(request: TitleLinkRequest) => void>();

export const createLinksHandler = (
  respond: (body: TitleLinkRequest, index: number) => Response | Promise<Response> = () =>
    new HttpResponse(null, { status: 204 }),
) =>
  http.put(apiPath('/titles/:titleId/links'), async ({ request }) => {
    const body = (await request.json()) as TitleLinkRequest;
    LINK_REQUESTS(body);
    return respond(body, LINK_REQUESTS.mock.calls.length);
  });

export const CONFLICT_HANDLERS = [
  createLinksHandler((body) =>
    body.targetId === TITLE_MATCHES_RESPONSE.items[1]!.title.id && !body.bookmarkFolderId
      ? apiError(API_ERROR_CODE.BOOKMARK_FOLDER_CONFLICT, 'Нужно выбрать папку', 409)
      : new HttpResponse(null, { status: 204 }),
  ),
  http.get(apiPath('/titles/:titleId/bookmark'), ({ params }) =>
    HttpResponse.json({
      folderId:
        params.titleId === TITLE_MATCHES_RESPONSE.items[1]!.title.id
          ? FOLDER_ID.PLANNED
          : FOLDER_ID.READING,
      conflict: null,
    }),
  ),
];

export const enterChecking = async () => {
  const button = await screen.findByRole('button', { name: I18N.t('checkLinks') });
  await clickEnabledButton(button);
  await screen.findAllByRole('checkbox');
};

export const selectMatches = async (count = 2) => {
  await enterChecking();
  const checkboxes = await screen.findAllByRole('checkbox');
  for (const checkbox of checkboxes.slice(0, count)) await userEvent.click(checkbox);
};

export const expectSelection = async (count: number) => {
  await waitFor(() =>
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(count),
  );
};

export const expectSavedSelection = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: I18N.t('confirmLinks') })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: I18N.t('backToViewing') })).toBeEnabled();
  });
  expect(screen.getAllByRole('checkbox', { checked: false })).toHaveLength(3);
};
