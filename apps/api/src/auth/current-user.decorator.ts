import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { SessionUser } from './session.service';

/** Пользователь текущей сессии — доступен на любом эндпоинте без @Public(). */
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();
  return request.user as SessionUser;
});
