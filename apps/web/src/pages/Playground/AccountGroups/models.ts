import { SOURCE_ID, type EnumLiteralsOf, type SourceId } from '@tanuki/contracts';

/** Состояние аккаунта группы — каждый макет рисуется во всех трёх рядом. */
export const ACCOUNT_STATE = {
  NONE: 'none',
  ACTIVE: 'active',
  RELOGIN: 'relogin',
} as const;
export type AccountState = EnumLiteralsOf<typeof ACCOUNT_STATE>;

export const ACCOUNT_STATES: AccountState[] = [
  ACCOUNT_STATE.NONE,
  ACCOUNT_STATE.ACTIVE,
  ACCOUNT_STATE.RELOGIN,
];

export type DemoSource = {
  id: SourceId;
  title: string;
  domain: string;
};

export const DEMO_LOGIN = 'tanuki_reader';

export const DEMO_SOURCES: DemoSource[] = [
  { id: SOURCE_ID.MINTMANGA, title: 'MintManga', domain: '2.mintmanga.one' },
  { id: SOURCE_ID.READMANGA_RU, title: 'ReadManga', domain: 'a.zazaza.me' },
  { id: SOURCE_ID.SEIMANGA, title: 'SeiManga', domain: '1.seimanga.me' },
  { id: SOURCE_ID.SELFMANGA, title: 'SelfManga', domain: '1.selfmanga.live' },
  { id: SOURCE_ID.USAGI, title: 'Usagi', domain: 'web.usagi.one' },
];

export type VariantProps = {
  state: AccountState;
};
