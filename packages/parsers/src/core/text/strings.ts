export const nullIfEmpty = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const toTitleCase = (value: string): string => {
  return value
    .split(' ')
    .map((word) =>
      word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
};

/** First capture group of `regex` in `text`, or null. Mirrors kotatsu's `findGroupValue`. */
export const findGroupValue = (text: string, regex: RegExp): string | null => {
  return regex.exec(text)?.[1] ?? null;
};
