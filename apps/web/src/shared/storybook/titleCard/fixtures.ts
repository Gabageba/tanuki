import { BOOKMARK_ITEM } from '../fixtures';
import { CONTINUE_READING_RESPONSE, TITLE } from '../titles';
import { EXAMPLE_TITLE } from './models';

export const CATALOG_CARD = { ...TITLE, name: EXAMPLE_TITLE.name };

export const BOOKMARK_CARD = {
  ...BOOKMARK_ITEM,
  name: EXAMPLE_TITLE.name,
  newChaptersCount: 3,
  latestChapterNumber: 377,
  latestNewAt: '2026-10-15T08:00:00Z',
};

const CONTINUE_ITEM = CONTINUE_READING_RESPONSE.items[0]!;

export const CONTINUE_CARD = {
  ...CONTINUE_ITEM,
  title: { ...CONTINUE_ITEM.title, name: EXAMPLE_TITLE.name },
};
