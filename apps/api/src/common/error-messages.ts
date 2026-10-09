import { LANGUAGE, LanguageSchema, type Language } from '@tanuki/contracts';

/**
 * Тексты ошибок, которые уходят клиенту в `error.message`. Русский — базовый язык, как и в
 * словарях фронта; ключ — буквальный английский перевод значения.
 */
const ERROR_MESSAGES_RU = {
  sourceUnavailable: 'Источник недоступен',
  sourceReturnedAntiBotChallenge: 'Источник вернул антибот-челлендж',
  sourceShowsThisOnlyToLoggedIn: '{{source}} показывает это только авторизованным',
  sourceSessionExpired: 'Сохранённая сессия источника истекла, требуется повторный вход',
  parserFailedToReadSourceResponse: 'Парсер не смог разобрать ответ источника',
  sourceOpensOnlyViaYourAccount: '{{source}} открывается только через ваш аккаунт на нём',
  sourceNoLongerAcceptsSavedLogin:
    '{{source}} больше не принимает сохранённый вход — войдите заново',
  sourceRejectedLoginData: 'Источник не принял данные для входа',
  sourceAccountLinkingNotConfigured: 'Привязка аккаунтов источников не настроена на сервере',
  adultSourcesHiddenInSettings: '{{source}} — источник 18+, такие источники скрыты в настройках',
  adultTitlesOnRegularSourcesHiddenInSettings:
    'Тайтлы 18+ на обычных источниках скрыты в настройках',
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
  accountScheduledForDeletion: 'Аккаунт ожидает удаления',
  accountBlockedUntilDate: 'Аккаунт заблокирован до {{date}}',
  // Не точкой: дата кончается на «г.», и вышло бы «г..».
  accountBlockedUntilDateReason: 'Аккаунт заблокирован до {{date}}, причина: {{reason}}',
  accountBlockedForever: 'Аккаунт заблокирован навсегда',
  accountBlockedForeverReason: 'Аккаунт заблокирован навсегда, причина: {{reason}}',
  wrongPassword: 'Неверный пароль',
  emailAlreadyRegistered: 'Эта почта уже зарегистрирована',
  usernameAlreadyTaken: 'Это имя пользователя уже занято',
  couldNotReadImage: 'Не удалось прочитать картинку',
  inviteInvalidOrUsed: 'Приглашение недействительно или уже использовано',
  linkInvalidOrExpired: 'Ссылка недействительна или устарела',
  wrongCode: 'Неверный код',
  codeExpiredRequestNew: 'Код устарел, запросите новый',
  tooManyAttempts: 'Слишком много попыток, попробуйте позже',
  tooManyAttemptsTryAgainInSeconds: 'Слишком много попыток, попробуйте через {{count}}\u00a0с',
  tooManyAttemptsTryAgainInMinutes: 'Слишком много попыток, попробуйте через {{count}}\u00a0мин',
  invalidRequest: 'Некорректный запрос',
  searchQueryMissing: 'Не указан поисковый запрос',
  unknownFilterValue: 'Неизвестное значение фильтра: {{value}}',
  internalServerError: 'Внутренняя ошибка сервера',
  customFoldersLimit: 'Своих папок может быть не больше {{count}}',
  folderNameTaken: 'Папка с таким названием уже есть',
  builtInFolderCantBeChanged: 'Встроенную папку нельзя переименовать или удалить',
  bothTitlesInBookmarksInDifferentFolders:
    'Оба тайтла в закладках в разных папках — выберите, в какой оставить',
  folderNotFound: 'Папка не найдена',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES_RU;

const ERROR_MESSAGES_EN: Record<ErrorMessageKey, string> = {
  sourceUnavailable: 'Source is unavailable',
  sourceReturnedAntiBotChallenge: 'Source returned an anti-bot challenge',
  sourceShowsThisOnlyToLoggedIn: '{{source}} shows this only to logged-in users',
  sourceSessionExpired: 'Saved source session has expired, a new login is required',
  parserFailedToReadSourceResponse: "Parser couldn't read the source response",
  sourceOpensOnlyViaYourAccount: '{{source}} opens only via your own account on it',
  sourceNoLongerAcceptsSavedLogin: '{{source}} no longer accepts the saved login — log in again',
  sourceRejectedLoginData: 'The source rejected the login data',
  sourceAccountLinkingNotConfigured: 'Source account linking is not configured on the server',
  adultSourcesHiddenInSettings: '{{source}} is an 18+ source, such sources are hidden in settings',
  adultTitlesOnRegularSourcesHiddenInSettings:
    '18+ titles on regular sources are hidden in settings',
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
  accountScheduledForDeletion: 'The account is scheduled for deletion',
  accountBlockedUntilDate: 'The account is blocked until {{date}}',
  accountBlockedUntilDateReason: 'The account is blocked until {{date}}. Reason: {{reason}}',
  accountBlockedForever: 'The account is blocked permanently',
  accountBlockedForeverReason: 'The account is blocked permanently. Reason: {{reason}}',
  wrongPassword: 'Wrong password',
  emailAlreadyRegistered: 'This email is already registered',
  usernameAlreadyTaken: 'This username is already taken',
  couldNotReadImage: "Couldn't read the image",
  inviteInvalidOrUsed: 'The invite is invalid or has already been used',
  linkInvalidOrExpired: 'The link is invalid or has expired',
  wrongCode: 'Wrong code',
  codeExpiredRequestNew: 'The code has expired, request a new one',
  tooManyAttempts: 'Too many attempts, try again later',
  tooManyAttemptsTryAgainInSeconds: 'Too many attempts, try again in {{count}}\u00a0s',
  tooManyAttemptsTryAgainInMinutes: 'Too many attempts, try again in {{count}}\u00a0min',
  invalidRequest: 'Invalid request',
  searchQueryMissing: 'Search query is missing',
  unknownFilterValue: 'Unknown filter value: {{value}}',
  internalServerError: 'Internal server error',
  customFoldersLimit: 'You can have at most {{count}} custom folders',
  folderNameTaken: 'A folder with this name already exists',
  builtInFolderCantBeChanged: "A built-in folder can't be renamed or deleted",
  bothTitlesInBookmarksInDifferentFolders:
    'Both titles are bookmarked in different folders — choose which one to keep',
  folderNotFound: 'Folder not found',
};

/**
 * Дата в параметре форматируется под язык ответа: «12 октября 2026 г.», «October 12, 2026». Пробелы
 * внутри неё неразрывные — строка не переносится между «2026» и «г.».
 */
export type ErrorMessageParams = Record<string, string | number | Date>;

const formatParam = (value: string | number | Date, language: Language): string =>
  value instanceof Date
    ? new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(value)
        .replace(/\s/g, '\u00a0')
    : String(value);

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
    params?.[name] === undefined ? placeholder : formatParam(params[name], language),
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
