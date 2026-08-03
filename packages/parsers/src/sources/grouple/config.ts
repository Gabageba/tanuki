export interface GroupleConfig {
  id: string;
  title: string;
  /** SSO site id, used to build the login/authUrl for this specific site. */
  siteId: number;
  domains: [string, ...string[]];
  /** SSO gateway host. AllHentai uses a separate gateway (qawa.org) from the rest of the network. */
  authGateway: string;
  isNsfw: boolean;
  /** AllHentai also accepts this cookie name as proof of auth, in addition to `gwt`. */
  extraAuthCookies?: string[];
}

export const MAIN_AUTH_GATEWAY = '3.grouple.co';

export const GROUPLE_CONFIGS: GroupleConfig[] = [
  {
    id: 'READMANGA_RU',
    title: 'ReadManga',
    siteId: 1,
    domains: ['a.zazaza.me', '3.readmanga.ru'],
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'MINTMANGA',
    title: 'MintManga',
    siteId: 2,
    domains: ['2.mintmanga.one', '24.mintmanga.one', 'mintmanga.live', 'mintmanga.com'],
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'SELFMANGA',
    title: 'SelfManga',
    siteId: 3,
    domains: ['1.selfmanga.live', 'selfmanga.live'],
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'SEIMANGA',
    title: 'SeiManga',
    siteId: 21,
    domains: ['1.seimanga.me', 'seimanga.me'],
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'USAGI',
    title: 'Usagi',
    siteId: 1,
    domains: ['web.usagi.one'],
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'ALLHENTAI',
    title: 'AllHentai',
    siteId: 1,
    domains: ['20.allhen.online', 'z.ahen.me', '24.allhen.online', '2023.allhen.online'],
    authGateway: 'qawa.org',
    isNsfw: true,
    extraAuthCookies: ['remember_me'],
  },
];
