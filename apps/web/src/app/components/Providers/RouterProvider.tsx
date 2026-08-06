import { createBrowserRouter, RouterProvider as InternalRouterProvider } from 'react-router';
import Layout from '@/app/components/Layout/Layout';
import CatalogPage from '@/pages/Catalog/CatalogPage';
import MangaPage from '@/pages/Manga/MangaPage';
import ReaderPage from '@/pages/Reader/ReaderPage';
import SearchPage from '@/pages/Search/SearchPage';
import Sources from '@/pages/Sources';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Sources />,
      },
      {
        path: '/search',
        element: <SearchPage />,
      },
      {
        path: '/source/:sourceId',
        element: <CatalogPage />,
      },
      {
        path: '/manga/:sourceId/:mangaId',
        element: <MangaPage />,
      },
    ],
  },
  // Читалка живёт вне общего каркаса: она на весь экран и с чёрным фоном, шапка ей мешает.
  {
    path: '/manga/:sourceId/:mangaId/read/:chapterId',
    element: <ReaderPage />,
  },
]);

function RouterProvider() {
  return <InternalRouterProvider router={router} />;
}

export default RouterProvider;
