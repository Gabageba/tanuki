import { HttpException, HttpStatus } from '@nestjs/common';
import { API_ERROR_CODE, LANGUAGE, type ApiErrorCode } from '@tanuki/contracts';
import {
  translateErrorMessage,
  type ErrorMessageKey,
  type ErrorMessageParams,
} from './error-messages';

type ApiExceptionOptions = {
  params?: ErrorMessageParams;
  sourceId?: string;
  retryAfter?: number;
  /** Внутренняя подробность для логов и статуса источника — клиенту не уходит. */
  detail?: string;
};

/**
 * Клиенту уходит `messageKey`, переведённый на язык запроса (см. HttpExceptionFilter).
 * `message` самого исключения — внутренний текст для логов: `detail`, если он есть, иначе
 * русский перевод ключа.
 */
export class ApiException extends HttpException {
  public readonly params?: ErrorMessageParams;
  public readonly sourceId?: string;
  public readonly retryAfter?: number;

  constructor(
    public readonly code: ApiErrorCode,
    public readonly messageKey: ErrorMessageKey,
    status: HttpStatus,
    { params, sourceId, retryAfter, detail }: ApiExceptionOptions = {},
  ) {
    super(detail ?? translateErrorMessage(LANGUAGE.RU, messageKey, params), status);
    this.params = params;
    this.sourceId = sourceId;
    this.retryAfter = retryAfter;
  }
}

export class SourceUnavailableException extends ApiException {
  constructor(sourceId?: string, retryAfter = 30) {
    super(API_ERROR_CODE.SOURCE_UNAVAILABLE, 'sourceUnavailable', HttpStatus.SERVICE_UNAVAILABLE, {
      sourceId,
      retryAfter,
    });
  }
}

export class SourceBlockedException extends ApiException {
  constructor(sourceId?: string) {
    super(API_ERROR_CODE.SOURCE_BLOCKED, 'sourceReturnedAntiBotChallenge', HttpStatus.BAD_GATEWAY, {
      sourceId,
    });
  }
}

// Источник из Grouple-сети (MintManga/Readmanga/SelfManga) пометил главу/тайтл как
// доступную только авторизованным — парсер бросает SourceAuthRequiredError
// (packages/parsers/src/errors.ts). Не путать с SOURCE_UNAVAILABLE: ретраить бессмысленно,
// нужна учётка GROUPLE_USERNAME/PASSWORD (packages/parsers/src/sources/grouple/auth.ts).
// ALLHENTAI — отдельный случай: у него свой шлюз qawa.org и своя учётка
// ALLHENTAI_USERNAME/PASSWORD, а авторизация там нужна для каталога целиком, а не только
// для отдельных глав.
export class SourceAuthRequiredException extends ApiException {
  constructor(sourceId?: string) {
    super(
      API_ERROR_CODE.SOURCE_AUTH_REQUIRED,
      'sourceRequiresAuthorization',
      HttpStatus.BAD_GATEWAY,
      { sourceId },
    );
  }
}

// LibSocial (MANGALIB/HENTAILIB/YAOILIB): a previously-stored OAuth token (see
// @tanuki/parsers SourceTokenExpiredError, sources/libsocial/auth.ts) is missing or was
// rejected on refresh. Distinct from SOURCE_AUTH_REQUIRED — that means "this particular
// chapter/title needs a session we never had"; this means "our saved session went stale and a
// human has to redo the reCAPTCHA-gated login" (`pnpm --filter @tanuki/parsers login:libsocial`).
export class SourceTokenExpiredException extends ApiException {
  constructor(sourceId?: string) {
    super(API_ERROR_CODE.SOURCE_TOKEN_EXPIRED, 'sourceSessionExpired', HttpStatus.BAD_GATEWAY, {
      sourceId,
    });
  }
}

/** `detail` — сырой текст ParseError: попадает в логи и статус источника, но не клиенту. */
export class ParserFailedException extends ApiException {
  constructor(sourceId?: string, detail?: string) {
    super(
      API_ERROR_CODE.PARSER_FAILED,
      'parserFailedToReadSourceResponse',
      HttpStatus.BAD_GATEWAY,
      {
        sourceId,
        detail,
      },
    );
  }
}

export class NotFoundApiException extends ApiException {
  constructor(messageKey: ErrorMessageKey = 'notFound', params?: ErrorMessageParams) {
    super(API_ERROR_CODE.NOT_FOUND, messageKey, HttpStatus.NOT_FOUND, { params });
  }
}

export class InvalidSignatureException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.INVALID_SIGNATURE, 'invalidImageSignature', HttpStatus.FORBIDDEN);
  }
}

/**
 * Постоянное хранилище недоступно. Возвращается только на запись: чтение при мёртвой базе
 * деградирует до результата без пользовательских правок, а вот молча потерять правку нельзя —
 * человек должен узнать, что его решение не сохранилось.
 */
export class StorageUnavailableException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.STORAGE_UNAVAILABLE,
      'storageUnavailableChangeNotSaved',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class RateLimitedException extends ApiException {
  constructor(sourceId?: string, retryAfter = 5) {
    super(API_ERROR_CODE.RATE_LIMITED, 'tooManySourceRequests', HttpStatus.TOO_MANY_REQUESTS, {
      sourceId,
      retryAfter,
    });
  }
}

/** Нет валидной сессии — брошено глобальным AuthGuard'ом на непубличном эндпоинте. */
export class UnauthorizedApiException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.UNAUTHORIZED, 'loginRequired', HttpStatus.UNAUTHORIZED);
  }
}

/** Сессия есть, но роль не подходит (например, не admin на /invites). */
export class ForbiddenApiException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.FORBIDDEN, 'insufficientPermissions', HttpStatus.FORBIDDEN);
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.INVALID_CREDENTIALS,
      'wrongEmailUsernameOrPassword',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class EmailNotVerifiedException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.EMAIL_NOT_VERIFIED, 'emailNotVerified', HttpStatus.FORBIDDEN);
  }
}

export class EmailTakenException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.EMAIL_TAKEN, 'emailAlreadyRegistered', HttpStatus.CONFLICT);
  }
}

export class UsernameTakenException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.USERNAME_TAKEN, 'usernameAlreadyTaken', HttpStatus.CONFLICT);
  }
}

export class InvalidImageException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.INVALID_IMAGE, 'couldNotReadImage', HttpStatus.BAD_REQUEST);
  }
}

export class InviteInvalidException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.INVITE_INVALID, 'inviteInvalidOrUsed', HttpStatus.BAD_REQUEST);
  }
}

/** Ссылка подтверждения почты или сброса пароля — не найдена, использована или истекла. */
export class TokenInvalidException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.TOKEN_INVALID, 'linkInvalidOrExpired', HttpStatus.BAD_REQUEST);
  }
}

export class TooManyRequestsException extends ApiException {
  constructor(retryAfter: number) {
    super(API_ERROR_CODE.TOO_MANY_REQUESTS, 'tooManyAttempts', HttpStatus.TOO_MANY_REQUESTS, {
      retryAfter,
    });
  }
}

/** Прочий 4xx без своего кода — например, не передан обязательный параметр. */
export class BadRequestApiException extends ApiException {
  constructor(messageKey: ErrorMessageKey = 'invalidRequest') {
    super(API_ERROR_CODE.BAD_REQUEST, messageKey, HttpStatus.BAD_REQUEST);
  }
}
