import {
  createBrowserRouter,
  Navigate,
  RouterProvider as InternalRouterProvider,
} from 'react-router';
import Layout from '@/app/Layout';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SearchPage from '@/pages/Search/SearchPage';
import Sources from '@/pages/Sources';
import SourcesHealth from '@/pages/SourcesHealth';
import Notifications from '@/pages/Notifications';
import Bookmarks from '@/pages/Bookmarks';
import Catalog from '@/pages/Catalog';
import Title from '@/pages/Title';
import Reader from '@/pages/Reader';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Navigate to={ROUTE_PATHS.SOURCES} replace />,
      },
      {
        path: ROUTE_PATHS.SOURCES,
        element: <Sources />,
      },
      {
        path: ROUTE_PATHS.SOURCES_HEALTH,
        element: <SourcesHealth />,
      },
      {
        path: ROUTE_PATHS.SEARCH,
        element: <SearchPage />,
      },
      {
        path: ROUTE_PATHS.CATALOG,
        element: <Catalog />,
      },
      {
        path: ROUTE_PATHS.TITLE,
        element: <Title />,
      },
      {
        path: ROUTE_PATHS.NOTIFICATIONS,
        element: <Notifications />,
      },
      {
        path: ROUTE_PATHS.BOOKMARKS,
        element: <Bookmarks />,
      },
    ],
  },
  // Читалка живёт вне общего каркаса: она на весь экран и с чёрным фоном, шапка ей мешает.
  {
    path: ROUTE_PATHS.READER,
    element: <Reader />,
  },
]);

function RouterProvider() {
  return <InternalRouterProvider router={router} />;
}

export default RouterProvider;
