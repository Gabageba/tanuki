export type GroupleConfig = {
  id: string;
  /** SSO site id, used to build the login/authUrl for this specific site. */
  siteId: number;
  /** SSO gateway host. AllHentai uses a separate gateway (z.qawa.org) from the rest of the network. */
  authGateway: string;
  isNsfw: boolean;
  /** AllHentai also accepts this cookie name as proof of auth, in addition to `gwt`. */
  extraAuthCookies?: string[];
};

export const MAIN_AUTH_GATEWAY = '3.grouple.co';

// title/domains live in SOURCE_CATALOG (../catalog) — look them up by id, don't duplicate here.
export const GROUPLE_CONFIGS: GroupleConfig[] = [
  {
    id: 'READMANGA_RU',
    siteId: 1,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'MINTMANGA',
    siteId: 2,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'SELFMANGA',
    siteId: 3,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'SEIMANGA',
    siteId: 21,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'USAGI',
    siteId: 1,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
  },
  {
    id: 'ALLHENTAI',
    siteId: 1,
    // qawa.org itself now 301s here; posting straight to qawa.org loses the login form body
    // because the HTTP client's redirect handling downgrades POST to GET on 301 (like a browser).
    authGateway: 'z.qawa.org',
    isNsfw: true,
    extraAuthCookies: ['remember_me'],
  },
];
