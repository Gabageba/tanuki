import { Box, Stack, Title } from '@mantine/core';
import { MOCK_CONTINUE } from '../mocks';
import { CONTINUE_CARD, HOME_FILL, type HomeFill } from '../models';
import ContinueReading from './ContinueReading';
import EntriesTiles from './EntriesTiles';
import HomePageTitle from './HomePageTitle';
import NewChaptersBlock from './NewChaptersBlock';
import SelectionsPreview from './SelectionsPreview';
import StaleBlock from './StaleBlock';

type Props = {
  fill: HomeFill;
};

/** Главная P4a + V2a, наполненная блоками оси W: «Продолжить», новые главы в закладках, плитки
 *  входов, превью подборок, давно не открытое. */
function HomeFilledPage({ fill }: Props) {
  const isMixed = fill !== HOME_FILL.RIBBONS;
  const continueBlock = <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />;
  const newChapters = <NewChaptersBlock asList={isMixed} />;
  const stale = <StaleBlock asCovers={isMixed} />;

  if (fill === HOME_FILL.ZONES) {
    return (
      <Stack gap="xl">
        <HomePageTitle withAllSources={false} />
        <Box p="md" bdrs="lg" bg="var(--mantine-primary-color-light)">
          <Stack gap="xl">
            {continueBlock}
            {newChapters}
            {stale}
          </Stack>
        </Box>
        <Stack gap="lg">
          <Title order={3}>Новое на сайтах</Title>
          <EntriesTiles />
          <SelectionsPreview />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <HomePageTitle withAllSources={false} />
      {continueBlock}
      {newChapters}
      <EntriesTiles />
      <SelectionsPreview />
      {stale}
    </Stack>
  );
}

export default HomeFilledPage;
