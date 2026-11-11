import type { EnumLiteralsOf } from '@tanuki/contracts';

export const PARSER_CALL_CONTEXT = {
  REQUEST: 'request',
  BACKGROUND: 'background',
  PROBE: 'probe',
} as const;
export type ParserCallContext = EnumLiteralsOf<typeof PARSER_CALL_CONTEXT>;

export const PARSER_OPERATION = {
  GET_LIST: 'getList',
  GET_DETAILS: 'getDetails',
  GET_PAGES: 'getPages',
  GET_FILTERS: 'getFilters',
  GET_HOME: 'getHome',
  GET_HOME_SECTION: 'getHomeSection',
  GET_BOOKMARKS: 'getBookmarks',
  DECODE_IMAGE: 'decodeImage',
} as const;
export type ParserOperation = EnumLiteralsOf<typeof PARSER_OPERATION>;
