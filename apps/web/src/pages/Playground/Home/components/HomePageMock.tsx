import { Divider, Group, Stack, Title } from '@mantine/core';
import MissedCollapse from '../../TitleSearch/components/MissedCollapse';
import { HOME_DESU, HOME_REMANGA, MOCK_CONTINUE, MOCK_MISSED } from '../mocks';
import { ALL_SOURCES_PLACE, type AllSourcesPlace } from '../models';
import AllSourcesLink from './AllSourcesLink';
import ContinueReading from './ContinueReading';
import HomeSections from './HomeSections';

/** Реманга — с двумя блоками из шести, чтобы страница целиком помещалась в макет. */
const HOMES = [{ ...HOME_REMANGA, blocks: HOME_REMANGA.blocks.slice(0, 2) }, HOME_DESU];

type Props = {
  place: AllSourcesPlace;
};

/** Главная целиком: заголовок, «Продолжить чтение», секции и «Не ответили» (N5). Ось A меняет
 *  только то, где «Все источники» и есть ли у страницы заголовок. */
function HomePageMock({ place }: Props) {
  const hasPageTitle = place !== ALL_SOURCES_PLACE.NO_PAGE_TITLE;
  const hasSelectionsRow = place !== ALL_SOURCES_PLACE.PAGE_TITLE;

  return (
    <Stack gap="lg">
      {hasPageTitle && (
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Title order={2}>Главная</Title>
            {place === ALL_SOURCES_PLACE.PAGE_TITLE && <AllSourcesLink asButton />}
          </Group>
          <Divider />
        </Stack>
      )}
      <ContinueReading items={MOCK_CONTINUE} />
      {hasSelectionsRow ? (
        <Group justify="space-between" wrap="nowrap" gap="sm" mt="md">
          <Title order={4}>Подборки источников</Title>
          <AllSourcesLink />
        </Group>
      ) : (
        <Divider my="md" />
      )}
      <HomeSections homes={HOMES} />
      <MissedCollapse missed={MOCK_MISSED} withRows />
    </Stack>
  );
}

export default HomePageMock;
