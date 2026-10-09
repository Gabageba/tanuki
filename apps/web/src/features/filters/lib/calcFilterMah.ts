const MIN_FILTER_SCROLL_HEIGHT = 420;

// Approximates the filter panel's non-scrolling chrome: title row, button row,
// the Stack's gaps between them, and the panel's own padding.
const FILTER_PANEL_CHROME_HEIGHT = 120;

export const calcFilterMah = (tabListHeight: number) =>
  Math.max(MIN_FILTER_SCROLL_HEIGHT, tabListHeight - FILTER_PANEL_CHROME_HEIGHT);
