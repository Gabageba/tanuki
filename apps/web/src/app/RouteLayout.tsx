import { useLayoutEffect, useRef } from 'react';
import { NavigationType, Outlet, useLocation, useMatch, useNavigationType } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

function RouteLayout() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const isReader = Boolean(useMatch(ROUTE_PATHS.READER));
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    // Назад/вперёд восстанавливает браузер; позицию внутри главы задаёт сама читалка.
    // Query-параметры не меняют страницу: прокруткой фильтров и вкладок управляют их блоки.
    if (navigationType === NavigationType.Pop || isReader) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, navigationType, isReader]);

  return <Outlet />;
}

export default RouteLayout;
