import { Divider, Stack } from '@mantine/core';
import MissedCollapse from '../../TitleSearch/components/MissedCollapse';
import { HOME_DESU, HOME_MANGALIB, HOME_REMANGA, MOCK_CONTINUE, MOCK_MISSED } from '../mocks';
import { CONTINUE_CARD, SECTION_STEP } from '../models';
import HomePageTitle from './HomePageTitle';
import ContinueReading from './ContinueReading';
import HomeSourceSection from './HomeSourceSection';
import HomeSourceTextTabsSkeleton from './HomeSourceTextTabsSkeleton';

const HOMES = [HOME_REMANGA, HOME_MANGALIB, HOME_DESU];

type Props = {
  /** Секции ещё грузятся (или не доехали до экрана) — Z1 под S2b. */
  isLoading: boolean;
};

/** Итог: A1 — заголовок с «Все источники», C1a + U1 — «Продолжить чтение», секции S2b + L1 (K1:
 *  короткий блок — короткая лента), «Не ответили» N5. */
function HomeSummaryPage({ isLoading }: Props) {
  return (
    <Stack gap="lg">
      <HomePageTitle />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      <Stack gap={0}>
        {HOMES.map((home) => (
          <Stack key={home.source.id} gap={0}>
            <Divider my="xl" />
            {isLoading ? (
              <HomeSourceTextTabsSkeleton blocks={home.blocks} />
            ) : (
              <HomeSourceSection home={home} step={SECTION_STEP.TABS_TEXT} />
            )}
          </Stack>
        ))}
      </Stack>
      {!isLoading && <MissedCollapse missed={MOCK_MISSED} withRows />}
    </Stack>
  );
}

export default HomeSummaryPage;
