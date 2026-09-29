import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { SessionRow } from './session.service';

/** Сессия, с которой пришёл запрос, — нужна, чтобы отличить «это устройство» от остальных. */
export const CurrentSession = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();
  return request.session as SessionRow;
});
