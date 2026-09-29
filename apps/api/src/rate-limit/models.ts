export const RATE_LIMIT = {
  LOGIN: { limit: 10, windowSeconds: 15 * 60 },
  REGISTER: { limit: 20, windowSeconds: 60 * 60 },
  CHECK_USERNAME: { limit: 60, windowSeconds: 60 },
  /** На адрес, не на IP — не даёт заспамить чужой почтовый ящик. */
  EMAIL_SHORT: { limit: 1, windowSeconds: 60 },
  EMAIL_HOURLY: { limit: 5, windowSeconds: 60 * 60 },
  /** Действия аккаунта, подтверждаемые текущим паролем: смена почты и пароля, удаление. */
  ACCOUNT_PASSWORD: { limit: 10, windowSeconds: 15 * 60 },
  /** Привязка аккаунта источника: вход идёт с IP сервера, частые попытки грозят баном шлюза. */
  SOURCE_LOGIN: { limit: 5, windowSeconds: 15 * 60 },
} as const;
