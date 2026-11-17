export const OVERSCAN_ROWS = 3;

export type GridLayout = {
  columns: number;
  gap: number;
  width: number;
  scrollMargin: number;
};

export const INITIAL_LAYOUT: GridLayout = { columns: 1, gap: 0, width: 0, scrollMargin: 0 };
