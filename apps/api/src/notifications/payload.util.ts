/** Строка из payload записи; всё, что не строка, — пустая строка. */
export const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Неотрицательное целое из payload записи; всё остальное — 0. */
export const count = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
