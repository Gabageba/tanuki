import { HOME_ENTRIES, type HomeEntries } from '../models';
import EntriesBlocks from './EntriesBlocks';
import EntriesLinkHeadings from './EntriesLinkHeadings';
import EntriesTiles from './EntriesTiles';
import EntriesTrailingTile from './EntriesTrailingTile';

type Props = {
  entries: HomeEntries;
};

/** Часть главной под «Продолжить» в варианте оси V. */
function HomeEntriesArea({ entries }: Props) {
  switch (entries) {
    case HOME_ENTRIES.BLOCKS:
      return <EntriesBlocks />;
    case HOME_ENTRIES.TILES:
      return <EntriesTiles withCards />;
    case HOME_ENTRIES.TILES_ONLY:
      return <EntriesTiles />;
    case HOME_ENTRIES.TILES_LOGOS:
      return <EntriesTiles withLogos />;
    case HOME_ENTRIES.SOURCES_TILE:
      return <EntriesTiles withCards withoutSelectionsTile />;
    case HOME_ENTRIES.TRAILING_TILE:
      return <EntriesTrailingTile />;
    case HOME_ENTRIES.LINK_HEADINGS:
      return <EntriesLinkHeadings />;
  }
}

export default HomeEntriesArea;
