export type Point = { x: number; y: number };
export type View = Point & { scale: number };
export type Pinch = {
  distance: number;
  center: Point;
  view: View;
};
export type Bounds = Point & { width: number; height: number };
