import { Stack } from '@mantine/core';
import { MOCK_CONTINUE } from '../mocks';
import { CONTINUE_CARD, HOME_ENTRIES, type HomeEntries } from '../models';
import ContinueReading from './ContinueReading';
import HomeEntriesArea from './HomeEntriesArea';
import HomePageTitle from './HomePageTitle';

type Props = {
  entries: HomeEntries;
};

/** P4a с входами оси V. «Все источники» у заголовка страницы — только в V3: в остальных у них
 *  своё место ниже. */
function HomeEntriesPage({ entries }: Props) {
  return (
    <Stack gap="xl">
      <HomePageTitle
        withAllSources={entries === HOME_ENTRIES.TRAILING_TILE}
        isAllSourcesProminent
      />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      <HomeEntriesArea entries={entries} />
    </Stack>
  );
}

export default HomeEntriesPage;
