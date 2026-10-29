import { BUILT_IN_BOOKMARK_FOLDER, type BuiltInBookmarkFolder } from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { generateUid } from '../../core/uid';
import { toAbsoluteUrl } from '../../core/html/urls';
import { ParseError, SourceAuthRequiredError } from '../../errors';
import type { RawBookmark, RawBookmarkFolder } from '../../types';
import { catalogEntryFor } from '../catalog';
import type { GroupleConfig } from './config';
import { GROUPLE_BOOKMARK_STATUS } from './models';
import type {
  GroupleBookmarkItem,
  GroupleBookmarkSettings,
  GroupleBookmarkStatus,
  GroupleBookmarksResponse,
} from './models';

const PAGE_SIZE = 50;

const getBuiltInFolder = (status: GroupleBookmarkStatus): BuiltInBookmarkFolder | null => {
  switch (status) {
    case GROUPLE_BOOKMARK_STATUS.WATCHING:
      return BUILT_IN_BOOKMARK_FOLDER.READING;
    case GROUPLE_BOOKMARK_STATUS.PLANNED:
      return BUILT_IN_BOOKMARK_FOLDER.PLANNED;
    case GROUPLE_BOOKMARK_STATUS.COMPLETED:
      return BUILT_IN_BOOKMARK_FOLDER.COMPLETED;
    case GROUPLE_BOOKMARK_STATUS.DROPPED:
      return BUILT_IN_BOOKMARK_FOLDER.DROPPED;
    case GROUPLE_BOOKMARK_STATUS.REVIEWING:
    case GROUPLE_BOOKMARK_STATUS.ON_HOLD:
    case GROUPLE_BOOKMARK_STATUS.FAVORITE:
    case GROUPLE_BOOKMARK_STATUS.USER_DEFINED:
    case GROUPLE_BOOKMARK_STATUS.USER_DEFINED_TWO:
    case GROUPLE_BOOKMARK_STATUS.USER_DEFINED_THREE:
      return null;
  }
};

const getFolders = (settings: GroupleBookmarkSettings): RawBookmarkFolder[] => {
  const folders = [
    { id: GROUPLE_BOOKMARK_STATUS.WATCHING, name: 'В процессе' },
    { id: GROUPLE_BOOKMARK_STATUS.REVIEWING, name: 'Пересматриваю' },
    { id: GROUPLE_BOOKMARK_STATUS.PLANNED, name: 'В планах' },
    { id: GROUPLE_BOOKMARK_STATUS.ON_HOLD, name: 'Отложено' },
    { id: GROUPLE_BOOKMARK_STATUS.COMPLETED, name: 'Готово' },
    { id: GROUPLE_BOOKMARK_STATUS.FAVORITE, name: 'Любимое' },
    { id: GROUPLE_BOOKMARK_STATUS.DROPPED, name: 'Брошено' },
    ...(settings.custom1Enabled
      ? [
          {
            id: GROUPLE_BOOKMARK_STATUS.USER_DEFINED,
            name: settings.customName1 || 'Пользовательская',
          },
        ]
      : []),
    ...(settings.custom2Enabled
      ? [
          {
            id: GROUPLE_BOOKMARK_STATUS.USER_DEFINED_TWO,
            name: settings.customName2 || 'Пользовательская 2',
          },
        ]
      : []),
    ...(settings.custom3Enabled
      ? [
          {
            id: GROUPLE_BOOKMARK_STATUS.USER_DEFINED_THREE,
            name: settings.customName3 || 'Пользовательская 3',
          },
        ]
      : []),
  ];
  return folders.map((folder) => ({ ...folder, builtIn: getBuiltInFolder(folder.id), items: [] }));
};

const parseBookmark = (
  item: GroupleBookmarkItem,
  cfg: GroupleConfig,
  domain: string,
): RawBookmark | null => {
  const element = item.element;
  // Общая библиотека содержит также отзывы, аниме и книги других сайтов сети.
  if (element.elementId.siteId !== cfg.siteId || element.elementId.type === 'REVIEW') return null;
  const url = new URL(element.elementUrl, `https://${domain}`).pathname;
  if (!element.name || url.split('/').filter(Boolean).length !== 1) return null;
  const position = item.resume?.url.match(/\/vol(\d+)\/([\d.]+)(?:[/?#]|$)/);
  return {
    id: generateUid(cfg.id, url),
    url,
    title: element.name,
    coverUrl: element.picUrl ? toAbsoluteUrl(element.picUrl, `https://${domain}/`) : null,
    contentRating: null,
    type: null,
    lastChapterVolume: position ? Number(position[1]) : null,
    lastChapterNumber: position ? Number(position[2]) : null,
  };
};

/** Штатный API кабинета Grouple: список читается POST-запросом, авторизация — gwt Bearer. */
export const fetchGroupleBookmarks = async (
  cfg: GroupleConfig,
  ctx: ParserContext,
  login: () => Promise<boolean>,
): Promise<RawBookmarkFolder[]> => {
  const account = currentSourceAccount(catalogEntryFor(cfg.id).authFamily);
  if (!account?.jar)
    throw new SourceAuthRequiredError('Bookmarks require the user’s own account', cfg.id);
  const gatewayUrl = `https://${cfg.authGateway}`;
  const jar = account.jar;
  const getToken = async () => {
    // Пользовательская cookie могла быть сохранена с домена MintManga, а не SSO-шлюза.
    const cookies = await jar.getCookies(`https://${ctx.domain}/`);
    const gatewayCookies = await jar.getCookies(`${gatewayUrl}/`);
    return [...cookies, ...gatewayCookies].find((cookie) => cookie.key === 'gwt')?.value;
  };
  let token = await getToken();
  if (!token && account.credentials) {
    await login();
    token = await getToken();
  }
  if (!token) throw new SourceAuthRequiredError('Grouple session expired', cfg.id);

  // У SSO и сайта разные домены; переносим только собственный JWT аккаунта.
  const getSettings = async () => {
    await jar.setCookie(`gwt=${token}; Path=/; Secure`, `${gatewayUrl}/`);
    const page = await ctx.http.get(`${gatewayUrl}/private/bookmarks`);
    return /\bvar BOOKMARK_SETTINGS\s*=\s*(\{[^\r\n]*\})\s*;/.exec(page.text())?.[1];
  };
  let settingsJson = await getSettings();
  if (!settingsJson && account.credentials) {
    await login();
    token = await getToken();
    if (token) settingsJson = await getSettings();
  }
  if (!settingsJson) throw new SourceAuthRequiredError('Grouple session expired', cfg.id);
  const folders = getFolders(JSON.parse(settingsJson) as GroupleBookmarkSettings);
  for (const folder of folders) {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const request = () =>
        ctx.http.request({
          url: `${gatewayUrl}/api/bookmark/list`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            siteFilter: [cfg.siteId],
            statusFilter: [folder.id],
            includeUpdates: true,
            limit: PAGE_SIZE,
            offset,
          }),
        });
      let response = await request();
      if (response.status === 401 && account.credentials) {
        await login();
        token = await getToken();
        response = await request();
      }
      if (response.status === 401 || response.status === 403)
        throw new SourceAuthRequiredError('Grouple session expired', cfg.id);
      if (response.status !== 200)
        throw new ParseError(`Bookmarks request failed: HTTP ${response.status}`, cfg.id);
      const data = response.json<GroupleBookmarksResponse>();
      if (!Array.isArray(data.list) || !Number.isFinite(data.total))
        throw new ParseError('Invalid bookmarks response', cfg.id);
      folder.items.push(
        ...data.list
          .map((item) => parseBookmark(item, cfg, ctx.domain))
          .filter((item): item is RawBookmark => item !== null),
      );
      if (offset + data.list.length >= data.total) break;
      if (data.list.length === 0) throw new ParseError('Incomplete bookmarks response', cfg.id);
    }
  }
  return folders;
};
