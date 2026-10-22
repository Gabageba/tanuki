import type { ReactNode } from 'react';
import { Outlet, Route, Routes } from 'react-router';
import AuthLayout from '@/app/AuthLayout';
import Layout from '@/app/Layout';
import { STORY_LAYOUT, type StoryLayout, type StoryRoute } from '@/shared/storybook/models';

type Props = {
  route: StoryRoute;
  children: ReactNode;
};

const getLayoutElement = (layout: StoryLayout) => {
  switch (layout) {
    case STORY_LAYOUT.APP:
      return <Layout />;
    case STORY_LAYOUT.AUTH:
      return <AuthLayout />;
    case STORY_LAYOUT.NONE:
      return <Outlet />;
  }
};

/** Страница на своём маршруте внутри каркаса — `useParams` и ссылки работают как в приложении. */
function StoryRoutes({ route, children }: Props) {
  return (
    <Routes>
      <Route element={getLayoutElement(route.layout)}>
        <Route path={route.path} element={children} />
        {/* Ссылки со страницы ведут в никуда — пусть хотя бы не на пустой экран. */}
        <Route path="*" element={null} />
      </Route>
    </Routes>
  );
}

export default StoryRoutes;
