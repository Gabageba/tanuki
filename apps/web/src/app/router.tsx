import { createBrowserRouter, RouterProvider } from 'react-router';
import { CatalogPage } from '@/pages/Catalog';
import { Home } from '@/pages/Home';
import { MangaPage } from '@/pages/Manga';
import { ReaderPage } from '@/pages/Reader';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/source/:sourceId',
    element: <CatalogPage />,
  },
  {
    path: '/manga/:sourceId/:mangaId',
    element: <MangaPage />,
  },
  {
    path: '/manga/:sourceId/:mangaId/read/:chapterId',
    element: <ReaderPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
