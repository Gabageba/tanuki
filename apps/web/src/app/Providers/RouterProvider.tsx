import { createBrowserRouter, RouterProvider as InternalRouterProvider } from 'react-router';
import Layout from '@/app/Layout';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import MangaPage from '@/pages/Manga/MangaPage';
import ReaderPage from '@/pages/Reader/ReaderPage';
import SearchPage from '@/pages/Search/SearchPage';
import Sources from '@/pages/Sources';
import Notifications from '@/pages/Notifications';
import Bookmarks from '@/pages/Bookmarks';
import Catalog from '@/pages/Catalog';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: ROUTE_PATHS.SOURCES,
        element: <Sources />,
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
        path: ROUTE_PATHS.MANGA,
        element: <MangaPage />,
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
    element: <ReaderPage />,
  },
]);

function RouterProvider() {
  return <InternalRouterProvider router={router} />;
}

export default RouterProvider;
