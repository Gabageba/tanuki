/** Строка из payload записи; всё, что не строка, — пустая строка. */
export const text = (value: unknown): string => (typeof value === 'string' ? value : '');
