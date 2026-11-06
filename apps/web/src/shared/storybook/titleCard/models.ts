import { fn } from 'storybook/test';
import type { TitleCardLayoutOptions } from '@/entities/title/card/TitleCard/models';
import { TITLE } from '../titles';

export type TitleCardExampleOptions = TitleCardLayoutOptions & {
  detailed?: boolean;
  withMeta?: boolean;
  withActions?: boolean;
  disabledAction?: boolean;
  emptyMeta?: boolean;
  zero?: boolean;
  noCover?: boolean;
  hidden?: boolean;
  overlay?: boolean;
};

export const EXAMPLE_TITLE = {
  name: 'Очень длинное название тайтла, которое переносится на несколько строк',
  coverUrl: TITLE.coverUrl,
};

export const EXAMPLE_ACTION_TO = '/title/remanga:berserk';
export const EXAMPLE_MOVE_ACTION = fn();
export const EXAMPLE_REMOVE_ACTION = fn();
