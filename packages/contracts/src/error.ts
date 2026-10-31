import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

export const API_ERROR_CODE = {
  SOURCE_UNAVAILABLE: 'sourceUnavailable',
  SOURCE_BLOCKED: 'sourceBlocked',
  SOURCE_AUTH_REQUIRED: 'sourceAuthRequired',
  SOURCE_TOKEN_EXPIRED: 'sourceTokenExpired',
  // У пользователя нет своего (живого) аккаунта на источнике — без него источник закрыт.
  SOURCE_ACCOUNT_REQUIRED: 'sourceAccountRequired',
  // Аккаунт привязан, но источник больше не принимает его сессию — нужно войти заново.
  SOURCE_RELOGIN_REQUIRED: 'sourceReloginRequired',
  // Привязка аккаунта не удалась: источник не принял логин/пароль или токен.
  SOURCE_LOGIN_FAILED: 'sourceLoginFailed',
  // Сайт не принял код из письма, которым подтверждается вход.
  SOURCE_LOGIN_CODE_REJECTED: 'sourceLoginCodeRejected',
  // Начатый вход с кодом из письма истёк или потерян — начинать надо с логина и пароля.
  SOURCE_LOGIN_EXPIRED: 'sourceLoginExpired',
  // На сервере не задан ключ шифрования аккаунтов — привязывать их некуда.
  SOURCE_LINKING_UNAVAILABLE: 'sourceLinkingUnavailable',
  // Источник или тайтл 18+ скрыт настройками пользователя (UserSettings.showAdultSources /
  // hideAdultTitles).
  ADULT_CONTENT_HIDDEN: 'adultContentHidden',
  PARSER_FAILED: 'parserFailed',
  NOT_FOUND: 'notFound',
  RATE_LIMITED: 'rateLimited',
  INVALID_SIGNATURE: 'invalidSignature',
  // Постоянное хранилище (Postgres) недоступно. Возвращается только на запись: чтение при
  // мёртвой базе деградирует до результата без пользовательских правок, а вот молча потерять
  // запись нельзя — клиент должен узнать, что его правка не сохранилась.
  STORAGE_UNAVAILABLE: 'storageUnavailable',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  INVALID_CREDENTIALS: 'invalidCredentials',
  EMAIL_NOT_VERIFIED: 'emailNotVerified',
  // Аккаунт ждёт удаления: вход возможен только с отменой удаления (LoginRequest.cancelDeletion).
  ACCOUNT_DELETION_SCHEDULED: 'accountDeletionScheduled',
  // Аккаунт заблокирован персоналом — текст ошибки несёт срок и причину.
  ACCOUNT_BLOCKED: 'accountBlocked',
  WRONG_PASSWORD: 'wrongPassword',
  EMAIL_TAKEN: 'emailTaken',
  USERNAME_TAKEN: 'usernameTaken',
  INVITE_INVALID: 'inviteInvalid',
  TOKEN_INVALID: 'tokenInvalid',
  // Код из письма неверный, истёк или сгорел после лимита попыток.
  CODE_INVALID: 'codeInvalid',
  TOO_MANY_REQUESTS: 'tooManyRequests',
  INVALID_IMAGE: 'invalidImage',
  // Своих папок закладок уже CUSTOM_BOOKMARK_FOLDERS_LIMIT.
  BOOKMARK_FOLDER_LIMIT: 'bookmarkFolderLimit',
  // Папка с таким названием (без учёта регистра, включая встроенные) уже есть.
  BOOKMARK_FOLDER_NAME_TAKEN: 'bookmarkFolderNameTaken',
  // Встроенную папку нельзя переименовать, перекрасить или удалить.
  BUILT_IN_BOOKMARK_FOLDER_READONLY: 'builtInBookmarkFolderReadonly',
  // Подтверждаемая связь склеивает закладки из разных папок — нужен bookmarkFolderId.
  BOOKMARK_FOLDER_CONFLICT: 'bookmarkFolderConflict',
  // Резервная копия сделана версией формата новее той, что понимает сервер.
  BACKUP_VERSION_UNSUPPORTED: 'backupVersionUnsupported',
  // Восстановление из копии или импорт из источника у этого пользователя уже идёт — второе
  // параллельно не запускается.
  RESTORE_IN_PROGRESS: 'restoreInProgress',
  // Фильтр поиска (types/states) содержит значение не из TITLE_TYPE/TITLE_STATE.
  SEARCH_FILTER_INVALID: 'searchFilterInvalid',
  // Тело или параметры запроса не прошли zod-схему.
  VALIDATION_FAILED: 'validationFailed',
  // Прочий 4xx, у которого нет своего кода.
  BAD_REQUEST: 'badRequest',
  // Непредвиденное падение сервера — всё, что не было ApiException/HttpException.
  INTERNAL: 'internal',
} as const;
export type ApiErrorCode = EnumLiteralsOf<typeof API_ERROR_CODE>;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODE);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    sourceId: z.string().optional(),
    retryAfter: z.number().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
