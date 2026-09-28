import { LANGUAGE, LanguageSchema, type Language } from '@tanuki/contracts';

/**
 * Тексты ошибок, которые уходят клиенту в `error.message`. Русский — базовый язык, как и в
 * словарях фронта; ключ — буквальный английский перевод значения.
 */
const ERROR_MESSAGES_RU = {
  sourceUnavailable: 'Источник недоступен',
  sourceReturnedAntiBotChallenge: 'Источник вернул антибот-челлендж',
  sourceRequiresAuthorization: 'Источник требует авторизации',
  sourceSessionExpired: 'Сохранённая сессия источника истекла, требуется повторный вход',
  parserFailedToReadSourceResponse: 'Парсер не смог разобрать ответ источника',
  notFound: 'Не найдено',
  chapterNotFromThisTitle: 'Глава не из этого тайтла',
  chapterNotFound: 'Глава не найдена',
  invalidTitleId: 'Некорректный id тайтла',
  invalidChapterId: 'Некорректный id главы',
  invalidIdentifier: 'Некорректный идентификатор {{id}}',
  sourceNotFound: 'Источник {{sourceId}} не найден',
  invalidImageSignature: 'Некорректная подпись у /img',
  storageUnavailableChangeNotSaved: 'Хранилище недоступно, правка не сохранена',
  tooManySourceRequests: 'Слишком много запросов к источнику, попробуйте позже',
  loginRequired: 'Требуется вход',
  insufficientPermissions: 'Недостаточно прав',
  wrongEmailUsernameOrPassword: 'Неверная почта, имя пользователя или пароль',
  emailNotVerified: 'Почта не подтверждена',
  emailAlreadyRegistered: 'Эта почта уже зарегистрирована',
  usernameAlreadyTaken: 'Это имя пользователя уже занято',
  couldNotReadImage: 'Не удалось прочитать картинку',
  inviteInvalidOrUsed: 'Приглашение недействительно или уже использовано',
  linkInvalidOrExpired: 'Ссылка недействительна или устарела',
  tooManyAttempts: 'Слишком много попыток, попробуйте позже',
  invalidRequest: 'Некорректный запрос',
  searchQueryMissing: 'Не указан поисковый запрос',
  internalServerError: 'Внутренняя ошибка сервера',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES_RU;

const ERROR_MESSAGES_EN: Record<ErrorMessageKey, string> = {
  sourceUnavailable: 'Source is unavailable',
  sourceReturnedAntiBotChallenge: 'Source returned an anti-bot challenge',
  sourceRequiresAuthorization: 'Source requires authorization',
  sourceSessionExpired: 'Saved source session has expired, a new login is required',
  parserFailedToReadSourceResponse: "Parser couldn't read the source response",
  notFound: 'Not found',
  chapterNotFromThisTitle: "Chapter doesn't belong to this title",
  chapterNotFound: 'Chapter not found',
  invalidTitleId: 'Invalid title id',
  invalidChapterId: 'Invalid chapter id',
  invalidIdentifier: 'Invalid identifier {{id}}',
  sourceNotFound: 'Source {{sourceId}} not found',
  invalidImageSignature: 'Invalid /img signature',
  storageUnavailableChangeNotSaved: 'Storage is unavailable, the change was not saved',
  tooManySourceRequests: 'Too many requests to the source, try again later',
  loginRequired: 'Login required',
  insufficientPermissions: 'Insufficient permissions',
  wrongEmailUsernameOrPassword: 'Wrong email, username or password',
  emailNotVerified: 'Email is not verified',
  emailAlreadyRegistered: 'This email is already registered',
  usernameAlreadyTaken: 'This username is already taken',
  couldNotReadImage: "Couldn't read the image",
  inviteInvalidOrUsed: 'The invite is invalid or has already been used',
  linkInvalidOrExpired: 'The link is invalid or has expired',
  tooManyAttempts: 'Too many attempts, try again later',
  invalidRequest: 'Invalid request',
  searchQueryMissing: 'Search query is missing',
  internalServerError: 'Internal server error',
};

export type ErrorMessageParams = Record<string, string | number>;

const getDictionary = (language: Language): Record<ErrorMessageKey, string> => {
  switch (language) {
    case LANGUAGE.RU:
      return ERROR_MESSAGES_RU;
    case LANGUAGE.EN:
      return ERROR_MESSAGES_EN;
  }
};

export const translateErrorMessage = (
  language: Language,
  key: ErrorMessageKey,
  params?: ErrorMessageParams,
): string =>
  getDictionary(language)[key].replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    params?.[name] === undefined ? placeholder : String(params[name]),
  );

/**
 * Язык ответа — из `Accept-Language`, который фронт выставляет по текущему языку интерфейса.
 * Берётся первый тег, от него — основной подтег (`en-US` → `en`); всё незнакомое — русский.
 */
export const resolveLanguage = (acceptLanguage: string | undefined): Language => {
  const primary = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim().split('-')[0];
  const parsed = LanguageSchema.safeParse(primary?.toLowerCase());
  return parsed.success ? parsed.data : LANGUAGE.RU;
};
