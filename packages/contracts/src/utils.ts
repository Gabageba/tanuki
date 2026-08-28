/**
 * Union of the values of a const object — the way we declare enums in this codebase instead of
 * `enum` or a bare `z.enum([...])`/string literal union:
 *
 *   export const SOURCE_STATUS = { ok: 'ok', degraded: 'degraded', down: 'down' } as const;
 *   export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;
 *
 * The object stays the single place the literals are written down, so both runtime code
 * (iteration, lookups, schema declaration) and the type derive from it.
 */
export type EnumLiteralsOf<T extends object> = T[keyof T];

const COMPACT_NUMBER_UNITS: readonly (readonly [threshold: number, suffix: string])[] = [
  [1_000_000_000, 'млрд'],
  [1_000_000, 'м'],
  [1_000, 'к'],
];

/** Shortens large numbers for display — 10000 -> "10к", 1500000 -> "1.5м". */
export const formatCompactNumber = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const unit = COMPACT_NUMBER_UNITS.find(([threshold]) => abs >= threshold);
  if (!unit) return `${sign}${abs}`;

  const [threshold, suffix] = unit;
  const rounded = Math.round((abs / threshold) * 10) / 10;
  return `${sign}${rounded}${suffix}`;
};
