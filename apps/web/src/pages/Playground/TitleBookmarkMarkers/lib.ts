import {
  TITLE_CARD_LIST_SIZE,
  type TitleCardListSize,
} from '@/entities/title/card/TitleCard/models';
import { BASIC_EXAMPLES, EDGE_EXAMPLES } from './mocks';
import { EXAMPLE_SET, type ExampleSet, type MarkerExample } from './models';

export const getExamples = (set: ExampleSet) => {
  switch (set) {
    case EXAMPLE_SET.BASIC:
      return BASIC_EXAMPLES;
    case EXAMPLE_SET.EDGE_CASES:
      return EDGE_EXAMPLES;
  }
};

export const getCardData = (example: MarkerExample, listSize: TitleCardListSize) => {
  const data = {
    ...example.title,
    bookmarkFolder: example.folder,
    availability: example.availability,
  };
  switch (listSize) {
    case TITLE_CARD_LIST_SIZE.REGULAR:
      return data;
    case TITLE_CARD_LIST_SIZE.COMPACT:
      return { ...data, description: null };
  }
};
