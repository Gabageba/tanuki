import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@tanuki/contracts';
import { ForbiddenApiException, UnauthorizedApiException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { setSessionCookie } from './cookie.util';
import { SESSION_COOKIE_NAME } from './models';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import { SessionService } from './session.service';

/**
 * Единственный guard приложения — закрывает весь /api/v1 по умолчанию. @Public() снимает
 * требование сессии (auth-эндпоинты, /health), @Roles(...) поверх неё сужает доступ по роли.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies[SESSION_COOKIE_NAME] as string | undefined;
    const resolved = token ? await this.sessionService.resolve(token) : null;

    if (!resolved) {
      if (isPublic) return true;
      throw new UnauthorizedApiException();
    }

    request.user = resolved.user;

    // Скользящее продление — до отправки ответа, чтобы cookie ещё можно было переставить.
    // SessionService.touch сам решает, рано ли ещё (не чаще раза в час), и не пишет в БД зря.
    const touched = await this.sessionService.touch(resolved.session);
    if (touched) {
      const reply = context.switchToHttp().getResponse<FastifyReply>();
      setSessionCookie(reply, token as string, {
        remember: resolved.session.remember,
        secure: this.env.COOKIE_SECURE,
      });
    }

    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(resolved.user.role)) {
      throw new ForbiddenApiException();
    }

    return true;
  }
}
