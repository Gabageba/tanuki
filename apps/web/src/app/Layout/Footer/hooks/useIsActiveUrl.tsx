import { matchPath, useLocation } from 'react-router';

function useIsActiveUrl(paths: string | string[]): boolean {
  const { pathname } = useLocation();
  const patterns = Array.isArray(paths) ? paths : [paths];

  return patterns.some((pattern) => matchPath(pattern, pathname) !== null);
}

export default useIsActiveUrl;
