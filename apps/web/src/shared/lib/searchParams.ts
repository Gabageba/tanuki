export type SearchParamValues = Record<string, string | number | string[] | undefined>;

/** Обновляет только переданные поля, сохраняя остальные параметры страницы. */
export const updateSearchParams = (
  current: URLSearchParams,
  patch: SearchParamValues,
  prefix = '',
) => {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    const name = `${prefix}${key}`;
    next.delete(name);
    if (Array.isArray(value)) {
      for (const item of value) next.append(name, item);
    } else if (value !== undefined && value !== '') {
      next.set(name, String(value));
    }
  }
  return next;
};

export const readEnumParam = <Value extends string>(
  params: URLSearchParams,
  key: string,
  values: Record<string, Value>,
  fallback: Value,
): Value => Object.values(values).find((value) => value === params.get(key)) ?? fallback;

export const readEnumListParam = <Value extends string>(
  params: URLSearchParams,
  key: string,
  values: Record<string, Value>,
): Value[] => Object.values(values).filter((value) => params.getAll(key).includes(value));

export const readPageParam = (params: URLSearchParams) => {
  const page = Number(params.get('page'));
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};
