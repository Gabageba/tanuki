export const isEmpty = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null;
};
