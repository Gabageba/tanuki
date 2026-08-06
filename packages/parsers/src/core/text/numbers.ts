export const parseFloatOrNull = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseIntOrNull = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};
