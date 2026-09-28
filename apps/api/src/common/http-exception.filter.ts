import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodValidationException } from 'nestjs-zod';
import { API_ERROR_CODE, type ApiError, type ApiErrorCode } from '@tanuki/contracts';
import { ApiException } from './errors';
import { resolveLanguage, translateErrorMessage, type ErrorMessageKey } from './error-messages';

type HttpExceptionError = {
  code: ApiErrorCode;
  messageKey: ErrorMessageKey;
};

/** Код и текст для HttpException, брошенного не нами (Nest, nestjs-zod, Fastify). */
const getHttpExceptionError = (exception: HttpException): HttpExceptionError => {
  if (exception instanceof ZodValidationException) {
    return { code: API_ERROR_CODE.VALIDATION_FAILED, messageKey: 'invalidRequest' };
  }

  switch (exception.getStatus()) {
    case HttpStatus.UNAUTHORIZED:
      return { code: API_ERROR_CODE.UNAUTHORIZED, messageKey: 'loginRequired' };
    case HttpStatus.FORBIDDEN:
      return { code: API_ERROR_CODE.FORBIDDEN, messageKey: 'insufficientPermissions' };
    case HttpStatus.NOT_FOUND:
      return { code: API_ERROR_CODE.NOT_FOUND, messageKey: 'notFound' };
    case HttpStatus.TOO_MANY_REQUESTS:
      return { code: API_ERROR_CODE.TOO_MANY_REQUESTS, messageKey: 'tooManyAttempts' };
  }

  return exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
    ? { code: API_ERROR_CODE.BAD_REQUEST, messageKey: 'invalidRequest' }
    : { code: API_ERROR_CODE.INTERNAL, messageKey: 'internalServerError' };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const language = resolveLanguage(http.getRequest<FastifyRequest>().headers['accept-language']);

    if (exception instanceof ApiException) {
      const body: ApiError = {
        error: {
          code: exception.code,
          message: translateErrorMessage(language, exception.messageKey, exception.params),
          sourceId: exception.sourceId,
          retryAfter: exception.retryAfter,
        },
      };
      reply.status(exception.getStatus()).send(body);
      return;
    }

    if (exception instanceof HttpException) {
      const { code, messageKey } = getHttpExceptionError(exception);
      const body: ApiError = {
        error: { code, message: translateErrorMessage(language, messageKey) },
      };
      reply.status(exception.getStatus()).send(body);
      return;
    }

    this.logger.error(exception);
    const body: ApiError = {
      error: {
        code: API_ERROR_CODE.INTERNAL,
        message: translateErrorMessage(language, 'internalServerError'),
      },
    };
    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(body);
  }
}
