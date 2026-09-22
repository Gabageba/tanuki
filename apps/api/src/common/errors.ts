import { HttpException, HttpStatus } from '@nestjs/common';
import { API_ERROR_CODE, type ApiErrorCode } from '@tanuki/contracts';

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
      API_ERROR_CODE.SOURCE_UNAVAILABLE,
      'Источник недоступен',
      HttpStatus.SERVICE_UNAVAILABLE,
      sourceId,
      retryAfter,
    );
  }
}

export class SourceBlockedException extends ApiException {
  constructor(sourceId?: string) {
    super(
      API_ERROR_CODE.SOURCE_BLOCKED,
      'Источник вернул антибот-челлендж',
      HttpStatus.BAD_GATEWAY,
      sourceId,
    );
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
      'Источник требует авторизации',
      HttpStatus.BAD_GATEWAY,
      sourceId,
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
    super(
      API_ERROR_CODE.SOURCE_TOKEN_EXPIRED,
      'Сохранённая сессия источника истекла, требуется повторный вход',
      HttpStatus.BAD_GATEWAY,
      sourceId,
    );
  }
}

export class ParserFailedException extends ApiException {
  constructor(message = 'Парсер не смог разобрать ответ источника', sourceId?: string) {
    super(API_ERROR_CODE.PARSER_FAILED, message, HttpStatus.BAD_GATEWAY, sourceId);
  }
}

export class NotFoundApiException extends ApiException {
  constructor(message = 'Не найдено') {
    super(API_ERROR_CODE.NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class InvalidSignatureException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.INVALID_SIGNATURE, 'Некорректная подпись у /img', HttpStatus.FORBIDDEN);
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
      'Хранилище недоступно, правка не сохранена',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class RateLimitedException extends ApiException {
  constructor(sourceId?: string, retryAfter = 5) {
    super(
      API_ERROR_CODE.RATE_LIMITED,
      'Слишком много запросов к источнику, попробуйте позже',
      HttpStatus.TOO_MANY_REQUESTS,
      sourceId,
      retryAfter,
    );
  }
}

/** Нет валидной сессии — брошено глобальным AuthGuard'ом на непубличном эндпоинте. */
export class UnauthorizedApiException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.UNAUTHORIZED, 'Требуется вход', HttpStatus.UNAUTHORIZED);
  }
}

/** Сессия есть, но роль не подходит (например, не admin на /invites). */
export class ForbiddenApiException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.FORBIDDEN, 'Недостаточно прав', HttpStatus.FORBIDDEN);
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.INVALID_CREDENTIALS,
      'Неверная почта, имя пользователя или пароль',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class EmailNotVerifiedException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.EMAIL_NOT_VERIFIED, 'Почта не подтверждена', HttpStatus.FORBIDDEN);
  }
}

export class EmailTakenException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.EMAIL_TAKEN, 'Эта почта уже зарегистрирована', HttpStatus.CONFLICT);
  }
}

export class UsernameTakenException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.USERNAME_TAKEN, 'Это имя пользователя уже занято', HttpStatus.CONFLICT);
  }
}

export class InviteInvalidException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.INVITE_INVALID,
      'Приглашение недействительно или уже использовано',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/** Ссылка подтверждения почты или сброса пароля — не найдена, использована или истекла. */
export class TokenInvalidException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.TOKEN_INVALID,
      'Ссылка недействительна или устарела',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TooManyRequestsException extends ApiException {
  constructor(retryAfter: number) {
    super(
      API_ERROR_CODE.TOO_MANY_REQUESTS,
      'Слишком много попыток, попробуйте позже',
      HttpStatus.TOO_MANY_REQUESTS,
      undefined,
      retryAfter,
    );
  }
}
