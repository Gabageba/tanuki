import { SOURCE_ID, SOURCE_LOGIN_REQUIREMENT } from '@tanuki/contracts';
import type { DemoSource } from './models';

/** Порядок как в настройках со скриншота; в профиль попадают только те, куда можно войти. */
export const DEMO_SOURCES: DemoSource[] = [
  {
    id: SOURCE_ID.MANGALIB,
    title: 'MangaLib',
    domain: 'mangalib.org',
    loginRequirement: SOURCE_LOGIN_REQUIREMENT.OPTIONAL,
    isLoggedIn: false,
    isReloginRequired: false,
    benefits: 'главы только для зарегистрированных, купленные главы',
  },
  {
    id: SOURCE_ID.DESUME,
    title: 'Desu',
    domain: 'desu.uno',
    loginRequirement: null,
    isLoggedIn: false,
    isReloginRequired: false,
    benefits: '',
  },
  {
    id: SOURCE_ID.MANGACHAN,
    title: 'Манга-тян',
    domain: 'im.manga-chan.me',
    loginRequirement: SOURCE_LOGIN_REQUIREMENT.REQUIRED,
    isLoggedIn: false,
    isReloginRequired: false,
    benefits: 'каталог и чтение глав',
  },
  {
    id: SOURCE_ID.MINTMANGA,
    title: 'MintManga',
    domain: '2.mintmanga.one',
    loginRequirement: SOURCE_LOGIN_REQUIREMENT.REQUIRED,
    isLoggedIn: true,
    isReloginRequired: true,
    benefits: 'каталог и чтение глав',
  },
  {
    id: SOURCE_ID.READMANGA_RU,
    title: 'ReadManga',
    domain: 'a.zazaza.me',
    loginRequirement: SOURCE_LOGIN_REQUIREMENT.REQUIRED,
    isLoggedIn: true,
    isReloginRequired: false,
    benefits: 'каталог и чтение глав',
  },
  {
    id: SOURCE_ID.INKSTORY,
    title: 'Inkstory',
    domain: 'inkstory.net',
    loginRequirement: null,
    isLoggedIn: false,
    isReloginRequired: false,
    benefits: '',
  },
];
