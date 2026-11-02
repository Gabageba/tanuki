import { createContext, type Dispatch, type SetStateAction } from 'react';

type Setting<T> = [T, Dispatch<SetStateAction<T>>];
export type ResultSettings = {
  mode: Setting<string>;
  direction: Setting<string>;
  pages: Setting<string>;
  background: Setting<string>;
  fit: Setting<string>;
  brightness: Setting<number>;
  prefetch: Setting<number>;
  wake: Setting<boolean>;
  width: Setting<number>;
  tap: Setting<number>;
  pageGap: Setting<number>;
  chapterGap: Setting<number>;
  autoNext: Setting<boolean>;
  hidePanels: Setting<boolean>;
};
export const RESULT_CONTEXT = createContext<ResultSettings | null>(null);
