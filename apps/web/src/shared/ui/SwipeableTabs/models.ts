export const ROOT_SELECTOR = '[data-swipeable-tabs]';
export const IGNORED_SELECTOR =
  '[role="tablist"], input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="switch"], [role="listbox"], [role="menu"], [draggable="true"], [data-no-tab-swipe]';
export const EDGE_DISTANCE = 24;
export const DIRECTION_DISTANCE = 12;
export const SWIPE_DISTANCE = 50;
export const HORIZONTAL_RATIO = 1.5;

export type TabSwipeGesture = {
  id: number;
  x: number;
  y: number;
  horizontal: boolean;
  target: Element;
  activeTab: HTMLButtonElement;
};
