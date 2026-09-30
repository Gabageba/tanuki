import { SOURCE_ID, type SourceId } from '@tanuki/contracts';
import { ACCOUNT_STATE, type AccountState } from '../SourcesSetup/models';

export type DemoImportSource = {
  id: SourceId;
  title: string;
  /** Сеть, чьим аккаунтом входят на источник: он один на все её сайты. */
  network: string;
  state: AccountState;
  login: string;
};

export type DemoNetwork = {
  title: string;
  state: AccountState;
  login: string;
  sources: DemoImportSource[];
};

export type VariantProps = {
  sourceId: SourceId | null;
  onChange: (sourceId: SourceId) => void;
};

/** Ширина модалки Mantine по умолчанию (`size="md"`) — макеты стоят в рамке той же ширины. */
export const MODAL_WIDTH = 440;

/** По сети на каждое состояние аккаунта: в Grouple вход выполнен, в LibSocial сессия истекла, в
 *  AllHentai и Реманге аккаунта нет. Источники без входа в импорт не попадают вовсе. */
export const DEMO_IMPORT_SOURCES: DemoImportSource[] = [
  {
    id: SOURCE_ID.READMANGA_RU,
    title: 'ReadManga',
    network: 'Grouple',
    state: ACCOUNT_STATE.ACTIVE,
    login: 'tanuki_reader',
  },
  {
    id: SOURCE_ID.MINTMANGA,
    title: 'MintManga',
    network: 'Grouple',
    state: ACCOUNT_STATE.ACTIVE,
    login: 'tanuki_reader',
  },
  {
    id: SOURCE_ID.SELFMANGA,
    title: 'SelfManga',
    network: 'Grouple',
    state: ACCOUNT_STATE.ACTIVE,
    login: 'tanuki_reader',
  },
  {
    id: SOURCE_ID.MANGALIB,
    title: 'MangaLib',
    network: 'LibSocial',
    state: ACCOUNT_STATE.RELOGIN,
    login: 'tanuki',
  },
  {
    id: SOURCE_ID.HENTAILIB,
    title: 'HentaiLib',
    network: 'LibSocial',
    state: ACCOUNT_STATE.RELOGIN,
    login: 'tanuki',
  },
  {
    id: SOURCE_ID.ALLHENTAI,
    title: 'AllHentai',
    network: 'AllHentai',
    state: ACCOUNT_STATE.NONE,
    login: '',
  },
  {
    id: SOURCE_ID.REMANGA,
    title: 'Реманга',
    network: 'Реманга',
    state: ACCOUNT_STATE.NONE,
    login: '',
  },
];
