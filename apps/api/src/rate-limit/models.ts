export const RATE_LIMIT = {
  LOGIN: { limit: 10, windowSeconds: 15 * 60 },
  REGISTER: { limit: 20, windowSeconds: 60 * 60 },
  CHECK_USERNAME: { limit: 60, windowSeconds: 60 },
  /** На адрес, не на IP — не даёт заспамить чужой почтовый ящик. */
  EMAIL_SHORT: { limit: 1, windowSeconds: 60 },
  EMAIL_HOURLY: { limit: 5, windowSeconds: 60 * 60 },
} as const;
