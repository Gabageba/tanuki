import { HttpException, HttpStatus } from '@nestjs/common';
import {
  API_ERROR_CODE,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
  LANGUAGE,
  SOURCE_CATALOG,
  type ApiErrorCode,
  type CatalogEntry,
} from '@tanuki/contracts';
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

/** Название источника для текста ошибки; незнакомый id уходит как есть. */
const sourceNameParams = (sourceId = ''): ErrorMessageParams => {
  const entry = (SOURCE_CATALOG as Record<string, CatalogEntry | undefined>)[sourceId];
  return { source: entry?.title ?? sourceId };
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
      'sourceShowsThisOnlyToLoggedIn',
      HttpStatus.BAD_GATEWAY,
      { sourceId, params: sourceNameParams(sourceId) },
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

/**
 * Источник закрыт для пользователя: своего аккаунта на нём нет или его сессия истекла. Не
 * сигнал здоровья источника — breaker и статус источника его не видят.
 */
export class SourceAccountRequiredException extends ApiException {
  /** isReloginRequired — аккаунт привязан, но источник больше не принимает его сессию. */
  constructor(sourceId?: string, isReloginRequired = false) {
    super(
      isReloginRequired
        ? API_ERROR_CODE.SOURCE_RELOGIN_REQUIRED
        : API_ERROR_CODE.SOURCE_ACCOUNT_REQUIRED,
      isReloginRequired ? 'sourceNoLongerAcceptsSavedLogin' : 'sourceOpensOnlyViaYourAccount',
      HttpStatus.FORBIDDEN,
      { sourceId, params: sourceNameParams(sourceId) },
    );
  }
}

/**
 * Источник или тайтл 18+ скрыт настройками самого пользователя. Как и закрытый источник, не
 * сигнал здоровья: бросается до обращения к источнику и к общему кешу.
 */
export class AdultContentHiddenException extends ApiException {
  /** isTitle — скрыт тайтл 18+ в обычном источнике, а не источник 18+ целиком. */
  constructor(sourceId: string, isTitle = false) {
    super(
      API_ERROR_CODE.ADULT_CONTENT_HIDDEN,
      isTitle ? 'adultTitlesOnRegularSourcesHiddenInSettings' : 'adultSourcesHiddenInSettings',
      HttpStatus.FORBIDDEN,
      { sourceId, params: sourceNameParams(sourceId) },
    );
  }
}

export class SourceLoginFailedException extends ApiException {
  constructor(messageKey: ErrorMessageKey = 'sourceRejectedLoginData') {
    super(API_ERROR_CODE.SOURCE_LOGIN_FAILED, messageKey, HttpStatus.BAD_REQUEST);
  }
}

export class SourceLoginCodeRejectedException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.SOURCE_LOGIN_CODE_REJECTED, 'sourceRejectedCode', HttpStatus.BAD_REQUEST);
  }
}

export class SourceLoginExpiredException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.SOURCE_LOGIN_EXPIRED,
      'loginExpiredEnterPasswordAgain',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class SourceLinkingUnavailableException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.SOURCE_LINKING_UNAVAILABLE,
      'sourceAccountLinkingNotConfigured',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
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

/** Аккаунт ждёт окончательного удаления — войти можно, только отменив его. */
export class AccountDeletionScheduledException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.ACCOUNT_DELETION_SCHEDULED,
      'accountScheduledForDeletion',
      HttpStatus.FORBIDDEN,
    );
  }
}

/** Аккаунт заблокирован персоналом — текст называет срок и причину, если она указана. */
export class AccountBlockedException extends ApiException {
  constructor(until: Date | null, reason: string | null) {
    super(
      API_ERROR_CODE.ACCOUNT_BLOCKED,
      getAccountBlockedMessageKey(until, reason),
      HttpStatus.FORBIDDEN,
      {
        params: { ...(until ? { date: until } : {}), ...(reason ? { reason } : {}) },
      },
    );
  }
}

const getAccountBlockedMessageKey = (
  until: Date | null,
  reason: string | null,
): ErrorMessageKey => {
  if (until) return reason ? 'accountBlockedUntilDateReason' : 'accountBlockedUntilDate';
  return reason ? 'accountBlockedForeverReason' : 'accountBlockedForever';
};

/** Текущий пароль не подошёл при действии, которое его подтверждает (смена почты, удаление…). */
export class WrongPasswordException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.WRONG_PASSWORD, 'wrongPassword', HttpStatus.FORBIDDEN);
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

/** Код подтверждения из письма: неверный (wrongCode) или уже недействителен (codeExpiredRequestNew). */
export class CodeInvalidException extends ApiException {
  constructor(messageKey: 'wrongCode' | 'codeExpiredRequestNew') {
    super(API_ERROR_CODE.CODE_INVALID, messageKey, HttpStatus.BAD_REQUEST);
  }
}

/** Текст сразу говорит, сколько ждать: до минуты — в секундах, дольше — в минутах. */
export class TooManyRequestsException extends ApiException {
  constructor(retryAfter: number) {
    const inMinutes = retryAfter >= 60;
    super(
      API_ERROR_CODE.TOO_MANY_REQUESTS,
      inMinutes ? 'tooManyAttemptsTryAgainInMinutes' : 'tooManyAttemptsTryAgainInSeconds',
      HttpStatus.TOO_MANY_REQUESTS,
      { retryAfter, params: { count: inMinutes ? Math.ceil(retryAfter / 60) : retryAfter } },
    );
  }
}

/** Прочий 4xx без своего кода — например, не передан обязательный параметр. */
export class BadRequestApiException extends ApiException {
  constructor(messageKey: ErrorMessageKey = 'invalidRequest') {
    super(API_ERROR_CODE.BAD_REQUEST, messageKey, HttpStatus.BAD_REQUEST);
  }
}

/** В `types`/`states` поиска значение не из TITLE_TYPE/TITLE_STATE. */
export class SearchFilterInvalidException extends ApiException {
  constructor(value: string) {
    super(API_ERROR_CODE.SEARCH_FILTER_INVALID, 'unknownFilterValue', HttpStatus.BAD_REQUEST, {
      params: { value },
    });
  }
}

export class BookmarkFolderLimitException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.BOOKMARK_FOLDER_LIMIT, 'customFoldersLimit', HttpStatus.CONFLICT, {
      params: { count: CUSTOM_BOOKMARK_FOLDERS_LIMIT },
    });
  }
}

export class BookmarkFolderNameTakenException extends ApiException {
  constructor() {
    super(API_ERROR_CODE.BOOKMARK_FOLDER_NAME_TAKEN, 'folderNameTaken', HttpStatus.CONFLICT);
  }
}

export class BuiltInBookmarkFolderReadonlyException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.BUILT_IN_BOOKMARK_FOLDER_READONLY,
      'builtInFolderCantBeChanged',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/** Подтверждаемая связь склеила бы закладки из разных папок — клиент спрашивает, какую оставить. */
export class BookmarkFolderConflictException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.BOOKMARK_FOLDER_CONFLICT,
      'bothTitlesInBookmarksInDifferentFolders',
      HttpStatus.CONFLICT,
    );
  }
}

/** Копия новее формата, который понимает сервер: в ней могут быть незнакомые поля. */
export class BackupVersionUnsupportedException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.BACKUP_VERSION_UNSUPPORTED,
      'backupFromNewerVersion',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/** Вторая запись в библиотеку того же пользователя — восстановление или импорт, — пока первая не
 *  записалась (две вкладки). */
export class RestoreInProgressException extends ApiException {
  constructor() {
    super(
      API_ERROR_CODE.RESTORE_IN_PROGRESS,
      'importOrRestoreAlreadyInProgress',
      HttpStatus.CONFLICT,
    );
  }
}

/** Парсер источника не умеет читать закладки. */
export class SourceImportUnsupportedException extends ApiException {
  constructor(sourceId: string) {
    super(
      API_ERROR_CODE.BAD_REQUEST,
      'sourceDoesNotSupportBookmarksImport',
      HttpStatus.BAD_REQUEST,
      { sourceId, params: sourceNameParams(sourceId) },
    );
  }
}
