/** Границы и пресеты числовой настройки читалки — форма READER_CONTAINER_WIDTH и соседей. */
export type ReaderRange = {
  MIN: number;
  MAX: number;
  NARROW: number;
  MEDIUM: number;
  WIDE: number;
};

export type ReaderPreset = {
  label: string;
  value: number;
};
