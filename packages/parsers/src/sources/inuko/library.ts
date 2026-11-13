import type { HttpClient } from '../../core/http/client';
import { UserAgents } from '../../core/http/user-agents';
import { ParseError } from '../../errors';
import { readInukoSsr } from './ssr';

/**
 * Inuko's November 2026 client uses TanStack Start server functions for the library.
 * Their IDs are build-specific. Discover them by their adjacent TanStack Query keys
 * instead of persisting hashes from a browser recording.
 */
const PAGE_SIZE = 40;
const MAX_PAGES = 100;
const BATCH_SIZE = 8;
const SERVER_FUNCTION_KEYS = ['infinite-folder-items-list', 'bookmarks'] as const;
type ServerFunctionKey = (typeof SERVER_FUNCTION_KEYS)[number];

export type InukoLibraryFolder = {
  id: string;
  name: string;
  system: boolean;
  sortOrder: number;
};

export type InukoLibraryItem = {
  folderId: string;
  bookId: string;
  book: {
    id: string;
    name: { ru: string };
    poster: string;
    serviceName: string;
    contentStatus?: string;
    country?: string;
  };
};

type InukoReadingBookmark = {
  bookId: string;
  updatedAt: string;
  chapter?: { number?: number; volume?: number } | null;
};

type SerovalValue = {
  t: number;
  i?: number;
  s?: unknown;
  a?: SerovalValue[];
  p?: { k: string[]; v: SerovalValue[] };
};

const invalid = (sourceId: string, message: string): never => {
  throw new ParseError(`${sourceId}: Inuko library ${message}`, sourceId);
};

export const decodeInukoServerResponse = (input: unknown, sourceId: string): unknown => {
  const read = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') return invalid(sourceId, 'invalid Seroval node');
    const value = node as SerovalValue;
    switch (value.t) {
      case 0:
      case 1:
        return value.s;
      case 2:
        switch (value.s) {
          case 0:
            return undefined;
          case 1:
            return null;
          case 2:
            return true;
          case 3:
            return false;
          default:
            return invalid(sourceId, 'unknown Seroval primitive');
        }
      case 9:
        if (!Array.isArray(value.a)) return invalid(sourceId, 'invalid Seroval array');
        return value.a.map(read);
      case 10: {
        if (
          !value.p ||
          !Array.isArray(value.p.k) ||
          !Array.isArray(value.p.v) ||
          value.p.k.length !== value.p.v.length
        )
          return invalid(sourceId, 'invalid Seroval object');
        const result: Record<string, unknown> = Object.create(null);
        for (let index = 0; index < value.p.k.length; index += 1) {
          const key = value.p.k[index]!;
          if (key === '__proto__' || key === 'constructor' || key === 'prototype')
            return invalid(sourceId, 'unsafe Seroval property');
          result[key] = read(value.p.v[index]);
        }
        return result;
      }
      case 11:
        return {};
      default:
        return invalid(sourceId, `unsupported Seroval tag ${value.t}`);
    }
  };
  const envelope = read(input);
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('result' in envelope) ||
    !('error' in envelope)
  )
    return invalid(sourceId, 'missing response envelope');
  const { result, error } = envelope as { result: unknown; error: unknown };
  if (error != null) return invalid(sourceId, 'server function returned an error');
  return result;
};

export const encodeInukoServerPayload = (data: Record<string, unknown>): string => {
  let reference = 0;
  const encode = (input: unknown): SerovalValue => {
    if (typeof input === 'string') return { t: 1, s: input };
    if (typeof input === 'number' && Number.isFinite(input)) return { t: 0, s: input };
    if (typeof input === 'boolean') return { t: 2, s: input ? 2 : 3 };
    if (input === null) return { t: 2, s: 1 };
    if (Array.isArray(input))
      return { t: 9, i: reference++, a: input.map(encode), o: 0 } as SerovalValue;
    if (typeof input === 'object' && input !== null) {
      const entries = Object.entries(input);
      return {
        t: 10,
        i: reference++,
        p: { k: entries.map(([key]) => key), v: entries.map(([, value]) => encode(value)) },
        o: 0,
      } as SerovalValue;
    }
    throw new TypeError('Unsupported Inuko server payload');
  };
  return JSON.stringify({ t: encode({ data }), f: 127, m: [] });
};

export const discoverInukoServerFunctions = (javascript: string, sourceId: string) => {
  const result = new Map<ServerFunctionKey, string>();
  // Keep the match tight: the handler is declared immediately before its queryKey.
  const pattern =
    /handler\(f\("([a-f0-9]{64})"\)\)[\s\S]{0,140}?queryKey:\["(infinite-folder-items-list|bookmarks)"/g;
  for (const match of javascript.matchAll(pattern)) {
    const key = match[2] as ServerFunctionKey;
    // The same bundle also has a global ["bookmarks"] query: it is NOT the
    // per-book reading-position API used by the library importer.
    if (
      key === 'bookmarks' &&
      !javascript.slice(match.index! + match[0].length).startsWith(',{bookId:')
    )
      continue;
    if (result.has(key) && result.get(key) !== match[1])
      return invalid(sourceId, `ambiguous server function: ${key}`);
    result.set(key, match[1]!);
  }
  for (const key of SERVER_FUNCTION_KEYS) {
    if (!result.has(key)) return invalid(sourceId, `server function not found: ${key}`);
  }
  return {
    folderItems: result.get('infinite-folder-items-list')!,
    bookmarks: result.get('bookmarks')!,
  };
};

export const findInukoClientBundle = (html: string, sourceId: string): string => {
  const match = /(?:src=["']|["']\/)(?:\/)?assets\/(tanstack-start-[a-zA-Z0-9_-]+\.js)/.exec(html);
  if (!match) return invalid(sourceId, 'TanStack client bundle not found');
  return `/assets/${match[1]}`;
};

const isFolder = (value: unknown): value is InukoLibraryFolder =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as InukoLibraryFolder).id === 'string' &&
  typeof (value as InukoLibraryFolder).name === 'string' &&
  typeof (value as InukoLibraryFolder).system === 'boolean' &&
  typeof (value as InukoLibraryFolder).sortOrder === 'number';

const isItem = (value: unknown): value is InukoLibraryItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as InukoLibraryItem;
  return (
    typeof item.folderId === 'string' &&
    typeof item.bookId === 'string' &&
    !!item.book &&
    typeof item.book.id === 'string' &&
    typeof item.book.name?.ru === 'string' &&
    typeof item.book.poster === 'string' &&
    typeof item.book.serviceName === 'string'
  );
};

export const fetchInukoLibrary = async (options: {
  http: HttpClient;
  domain: string;
  sourceId: string;
  serviceName: string;
  userId: string;
}) => {
  const { http, domain, sourceId, serviceName, userId } = options;
  const headers = { 'User-Agent': UserAgents.CHROME_DESKTOP };
  const res = await http.get(`https://${domain}/library`, headers);
  const html = res.text();
  const read = readInukoSsr(html, sourceId);
  const currentUser = read<{ id: string } | null>('currentUser');
  if (!currentUser || currentUser.id !== userId)
    return invalid(sourceId, 'session does not match library owner');
  const rawFolders = read<unknown>('folders');
  if (!Array.isArray(rawFolders) || !rawFolders.every(isFolder))
    return invalid(sourceId, 'invalid folders in SSR');

  const bundle = findInukoClientBundle(html, sourceId);
  const js = (await http.get(`https://${domain}${bundle}`, headers)).text();
  const functions = discoverInukoServerFunctions(js, sourceId);
  const call = async (
    hash: string,
    data: Record<string, unknown>,
    refererPath = '/library',
  ): Promise<unknown> => {
    const url = new URL(`https://${domain}/_serverFn/${hash}`);
    url.searchParams.set('payload', encodeInukoServerPayload(data));
    const response = await http.getJson<unknown>(url.toString(), {
      ...headers,
      Accept: 'application/x-tss-framed, application/x-ndjson, application/json',
      'x-tsr-serverfn': 'true',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      Referer: `https://${domain}${refererPath}`,
    });
    return decodeInukoServerResponse(response, sourceId);
  };

  const items: InukoLibraryItem[] = [];
  for (const folder of rawFolders) {
    let completed = false;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const rawItems = await call(
        functions.folderItems,
        {
          folderId: [folder.id],
          userId,
          includeSiblingDomains: true,
          size: PAGE_SIZE,
          page,
        },
        `/library?tab=${encodeURIComponent(folder.id)}`,
      );
      if (!Array.isArray(rawItems) || !rawItems.every(isItem))
        return invalid(sourceId, 'invalid folder items response');
      items.push(...rawItems.filter((item) => item.book.serviceName === serviceName));
      if (rawItems.length < PAGE_SIZE) {
        completed = true;
        break;
      }
    }
    if (!completed) return invalid(sourceId, 'folder pagination exceeded safety limit');
  }

  const latest = new Map<string, InukoReadingBookmark>();
  const bookIds = [...new Set(items.map((item) => item.bookId))];
  for (let start = 0; start < bookIds.length; start += BATCH_SIZE) {
    const responses = await Promise.all(
      bookIds
        .slice(start, start + BATCH_SIZE)
        .map((bookId) => call(functions.bookmarks, { bookId })),
    );
    for (const response of responses) {
      if (!Array.isArray(response)) return invalid(sourceId, 'invalid bookmarks response');
      for (const mark of response) {
        if (
          !mark ||
          typeof mark !== 'object' ||
          typeof mark.bookId !== 'string' ||
          typeof mark.updatedAt !== 'string'
        )
          return invalid(sourceId, 'invalid reading position');
        const previous = latest.get(mark.bookId);
        if (!previous || Date.parse(mark.updatedAt) > Date.parse(previous.updatedAt))
          latest.set(mark.bookId, mark as InukoReadingBookmark);
      }
    }
  }
  return { folders: rawFolders, items, positions: latest };
};
