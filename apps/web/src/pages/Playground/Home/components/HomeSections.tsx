import { Divider, Stack } from '@mantine/core';
import {
  CATALOG_LINK,
  SECTION_STEP,
  SHORT_BLOCKS,
  type CatalogLink,
  type HomeSource,
  type SectionStep,
  type ShortBlocks,
} from '../models';
import HomeSourceSection from './HomeSourceSection';

type Props = {
  homes: HomeSource[];
  step?: SectionStep;
  shortBlocks?: ShortBlocks;
  link?: CatalogLink;
};

/** Секции источников подряд. Между ними — `Divider` с отступом `xl`, как в поиске (R2); у S4 рамка
 *  уже отделяет секции, линия не нужна. */
function HomeSections({
  homes,
  step = SECTION_STEP.PLAIN,
  shortBlocks = SHORT_BLOCKS.RIBBON,
  link = CATALOG_LINK.RIGHT,
}: Props) {
  const isPaper = step === SECTION_STEP.PAPER;

  return (
    <Stack gap={isPaper ? 'lg' : 0}>
      {homes.map((home, index) => (
        <Stack key={home.source.id} gap={0}>
          {index > 0 && !isPaper && <Divider my="xl" />}
          <HomeSourceSection home={home} step={step} shortBlocks={shortBlocks} link={link} />
        </Stack>
      ))}
    </Stack>
  );
}

export default HomeSections;
