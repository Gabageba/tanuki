import { Box, Stack, Title } from '@mantine/core';
import { MOCK_CONTINUE, MOCK_HOME_ALL } from '../mocks';
import { CONTINUE_CARD } from '../models';
import ContinueReading from './ContinueReading';
import HomePageTitle from './HomePageTitle';
import HomeSourceBannerSection from './HomeSourceBannerSection';

/** P1 — две зоны разного вида на одной странице: «моё» на акцентной подложке, ниже — подборки,
 *  где каждый источник начинается плашкой своего цвета. */
function HomeZonesPage() {
  return (
    <Stack gap="xl">
      <HomePageTitle />
      <Box p="md" bdrs="lg" bg="var(--mantine-primary-color-light)">
        <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      </Box>
      <Stack gap="lg">
        <Title order={4}>Подборки источников</Title>
        <Stack gap={48}>
          {MOCK_HOME_ALL.slice(0, 3).map((home) => (
            <HomeSourceBannerSection key={home.source.id} home={home} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default HomeZonesPage;
