import { Route, Routes } from 'react-router';
import NotFound from '@/pages/NotFound';
import Playground from '@/pages/Playground';
import { PLAYGROUND_TASKS } from '@/pages/Playground/models';

/** Маршруты песочницы под `/playground/*`. Подключается в приложение лениво и только в DEV — так
 *  ни страницы, ни их адреса не попадают в прод-сборку. Новая задача регистрируется одной записью
 *  в `PLAYGROUND_TASKS`. */
function PlaygroundRouter() {
  return (
    <Routes>
      <Route index element={<Playground />} />
      {PLAYGROUND_TASKS.map(({ slug, Component }) => (
        <Route key={slug} path={slug} element={<Component />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default PlaygroundRouter;
