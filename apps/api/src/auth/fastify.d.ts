import type { SessionRow, SessionUser } from './session.service';

// AuthGuard кладёт пользователя и его сессию сюда — читают @CurrentUser(), @CurrentSession()
// и Roles-проверка в самом guard'е.
declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
    session?: SessionRow;
  }
}
