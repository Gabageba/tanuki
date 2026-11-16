import { matchPath } from 'react-router';
import { ROUTE_PATHS } from './routes';

const LIST_ROUTES = [
  ROUTE_PATHS.BOOKMARKS,
  ROUTE_PATHS.CATALOG,
  ROUTE_PATHS.NOTIFICATIONS,
  ROUTE_PATHS.PROFILE,
  ROUTE_PATHS.MANAGEMENT,
  ROUTE_PATHS.SOURCES_HEALTH,
];
const STORAGE_PREFIX = 'tanuki:list-location:';

/** Последний адрес каждого списка хранится в текущей вкладке, в том числе после чтения главы. */
export const rememberListLocation = (pathname: string, search: string) => {
  if (!LIST_ROUTES.some((path) => matchPath(path, pathname))) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${pathname}`, search);
  } catch {
    // Навигация работает и при недоступном хранилище браузера.
  }
};

export const getListPath = (pathname: string) => {
  try {
    const search = sessionStorage.getItem(`${STORAGE_PREFIX}${pathname}`) ?? '';
    return `${pathname}${search.startsWith('?') ? search : ''}`;
  } catch {
    return pathname;
  }
};
