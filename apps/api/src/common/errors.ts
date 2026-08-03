import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@tanuki/contracts';

export class ApiException extends HttpException {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    status: HttpStatus,
    public readonly sourceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(message, status);
  }
}

export class SourceUnavailableException extends ApiException {
  constructor(sourceId?: string, retryAfter = 30) {
    super(
      'SOURCE_UNAVAILABLE',
      'Источник недоступен',
      HttpStatus.SERVICE_UNAVAILABLE,
      sourceId,
      retryAfter,
    );
  }
}

export class SourceBlockedException extends ApiException {
  constructor(sourceId?: string) {
    super('SOURCE_BLOCKED', 'Источник вернул антибот-челлендж', HttpStatus.BAD_GATEWAY, sourceId);
  }
}

// Источник из Grouple-сети (MintManga/Readmanga/SelfManga) пометил главу/тайтл как
// доступную только авторизованным — сайдкар парсеров получает AuthRequiredException и
// сигнализирует об этом статусом 401 (apps/parsers/.../routes/Routes.kt). Не путать с
// SOURCE_UNAVAILABLE: ретраить бессмысленно, нужна учётка GROUPLE_USERNAME/PASSWORD
// у сайдкара (apps/parsers/src/main/kotlin/.../loader/GroupleAuth.kt).
export class SourceAuthRequiredException extends ApiException {
  constructor(sourceId?: string) {
    super(
      'SOURCE_AUTH_REQUIRED',
      'Источник требует авторизации для этой главы',
      HttpStatus.BAD_GATEWAY,
      sourceId,
    );
  }
}

export class ParserFailedException extends ApiException {
  constructor(message = 'Парсер не смог разобрать ответ источника', sourceId?: string) {
    super('PARSER_FAILED', message, HttpStatus.BAD_GATEWAY, sourceId);
  }
}

export class NotFoundApiException extends ApiException {
  constructor(message = 'Не найдено') {
    super('NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class InvalidSignatureException extends ApiException {
  constructor() {
    super('INVALID_SIGNATURE', 'Некорректная подпись у /img', HttpStatus.FORBIDDEN);
  }
}

export class RateLimitedException extends ApiException {
  constructor(sourceId?: string, retryAfter = 5) {
    super(
      'RATE_LIMITED',
      'Слишком много запросов к источнику, попробуйте позже',
      HttpStatus.TOO_MANY_REQUESTS,
      sourceId,
      retryAfter,
    );
  }
}
