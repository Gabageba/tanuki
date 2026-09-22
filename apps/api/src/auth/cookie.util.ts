import type { FastifyReply } from 'fastify';
import { SESSION_COOKIE_NAME, SESSION_REMEMBER_MS } from './models';

/**
 * Ставит cookie сессии. Без remember — cookie сессии браузера (нет maxAge, живёт до закрытия
 * вкладки); с remember — maxAge на 30 дней, который AuthGuard переставляет заново при каждом
 * скользящем продлении, так что активный пользователь не разлогинивается.
 */
export const setSessionCookie = (
  reply: FastifyReply,
  token: string,
  options: { remember: boolean; secure: boolean },
): void => {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secure,
    ...(options.remember ? { maxAge: SESSION_REMEMBER_MS / 1000 } : {}),
  });
};

export const clearSessionCookie = (reply: FastifyReply, secure: boolean): void => {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax', secure });
};
