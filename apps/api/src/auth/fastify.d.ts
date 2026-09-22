import type { SessionUser } from './session.service';

// AuthGuard кладёт пользователя сюда — читают @CurrentUser() и Roles-проверка в самом guard'е.
declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}
