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
