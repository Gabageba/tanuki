import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { ApiException } from './errors';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof ApiException) {
      reply.status(exception.getStatus()).send({
        error: {
          code: exception.code,
          message: exception.message,
          sourceId: exception.sourceId,
          retryAfter: exception.retryAfter,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      reply.status(status).send({
        error: {
          code:
            status === HttpStatus.NOT_FOUND
              ? API_ERROR_CODE.NOT_FOUND
              : API_ERROR_CODE.PARSER_FAILED,
          message: exception.message,
        },
      });
      return;
    }

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: { code: API_ERROR_CODE.PARSER_FAILED, message: 'Внутренняя ошибка сервера' },
    });
  }
}
