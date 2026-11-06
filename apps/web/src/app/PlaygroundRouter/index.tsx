import { Route, Routes } from 'react-router';
import NotFound from '@/pages/NotFound';
import Playground from '@/pages/Playground';
import PlaygroundLayout from '@/pages/Playground/PlaygroundLayout';
import { PLAYGROUND_TASKS } from '@/pages/Playground/models';
import PlaygroundProviders from './PlaygroundProviders';

/** Маршруты песочницы под `/playground/*`. Подключается в приложение лениво и только в DEV — так
 *  ни страницы, ни их адреса не попадают в прод-сборку. Новая задача регистрируется одной записью
 *  в `PLAYGROUND_TASKS`. Свой каркас и кеш позволяют смотреть макеты без сессии и API. */
function PlaygroundRouter() {
  return (
    <PlaygroundProviders>
      <PlaygroundLayout>
        <Routes>
          <Route index element={<Playground />} />
          {PLAYGROUND_TASKS.map(({ slug, Component }) => (
            <Route key={slug} path={slug} element={<Component />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PlaygroundLayout>
    </PlaygroundProviders>
  );
}

export default PlaygroundRouter;
