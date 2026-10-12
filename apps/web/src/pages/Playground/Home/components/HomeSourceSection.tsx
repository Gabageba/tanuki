import { Paper, Stack } from '@mantine/core';
import { catalogEntryFor } from '@tanuki/contracts';
import {
  CATALOG_LINK,
  SECTION_STEP,
  SHORT_BLOCKS,
  type CatalogLink,
  type HomeSource,
  type SectionStep,
  type ShortBlocks,
} from '../models';
import HomeBlocksArrows from './HomeBlocksArrows';
import HomeBlocksSegmented from './HomeBlocksSegmented';
import HomeBlocksStack from './HomeBlocksStack';
import HomeBlocksTabs from './HomeBlocksTabs';
import HomeBlocksTextTabs from './HomeBlocksTextTabs';
import HomeSourceHeader from './HomeSourceHeader';
import HomeSourceSelectSection from './HomeSourceSelectSection';

type Props = {
  home: HomeSource;
  step?: SectionStep;
  shortBlocks?: ShortBlocks;
  link?: CatalogLink;
};

/** Секция источника: заголовок и его блоки — в виде, который задают оси S, K и L. */
function HomeSourceSection({
  home: { source, blocks },
  step = SECTION_STEP.PLAIN,
  shortBlocks = SHORT_BLOCKS.RIBBON,
  link = CATALOG_LINK.RIGHT,
}: Props) {
  const header = <HomeSourceHeader source={source} link={link} />;
  const stack = <HomeBlocksStack blocks={blocks} shortBlocks={shortBlocks} />;

  switch (step) {
    case SECTION_STEP.PLAIN:
      return (
        <Stack gap="md">
          {header}
          {stack}
        </Stack>
      );
    case SECTION_STEP.TABS:
      return (
        <Stack gap="md">
          {header}
          <HomeBlocksTabs blocks={blocks} />
        </Stack>
      );
    case SECTION_STEP.TABS_SEGMENTED:
      return (
        <Stack gap="md">
          {header}
          <HomeBlocksSegmented blocks={blocks} />
        </Stack>
      );
    case SECTION_STEP.TABS_TEXT:
      return (
        <Stack gap="md">
          {header}
          <HomeBlocksTextTabs blocks={blocks} />
        </Stack>
      );
    case SECTION_STEP.TABS_SELECT:
      return <HomeSourceSelectSection home={{ source, blocks }} />;
    case SECTION_STEP.TABS_ARROWS:
      return (
        <Stack gap="md">
          {header}
          <HomeBlocksArrows blocks={blocks} />
        </Stack>
      );
    case SECTION_STEP.TABS_COUNT:
      return (
        <Stack gap="md">
          {header}
          <HomeBlocksTabs blocks={blocks} withCount />
        </Stack>
      );
    case SECTION_STEP.COLOR_LINE:
      return (
        <Stack gap="md">
          {header}
          <Stack pl="md" style={{ borderLeft: `3px solid ${catalogEntryFor(source.id).color}` }}>
            {stack}
          </Stack>
        </Stack>
      );
    case SECTION_STEP.PAPER:
      return (
        <Paper withBorder radius="lg" p="md">
          <Stack gap="md">
            {header}
            {stack}
          </Stack>
        </Paper>
      );
  }
}

export default HomeSourceSection;
