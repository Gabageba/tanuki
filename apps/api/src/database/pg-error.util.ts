import { PostgresError } from 'postgres';

const UNIQUE_VIOLATION = '23505';

/**
 * Имя нарушенного уникального индекса или null. Drizzle заворачивает ошибку драйвера в
 * DrizzleQueryError, так что сам PostgresError приходится доставать из `cause`.
 */
export const getUniqueViolation = (error: unknown): string | null => {
  const pgError = error instanceof Error && !(error instanceof PostgresError) ? error.cause : error;
  if (!(pgError instanceof PostgresError) || pgError.code !== UNIQUE_VIOLATION) return null;
  return pgError.constraint_name ?? null;
};
