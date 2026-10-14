import { useContext } from 'react';
import { Anchor, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { DISCOVER_PATH, MOCK_CONTINUE, MOCK_HOME_ALL } from '../mocks';
import { CONTINUE_CARD, SELECTIONS_ENTRY, type SelectionsEntry } from '../models';
import ContinueReading from './ContinueReading';
import HomePageTitle from './HomePageTitle';
import SourceEntryCard from './SourceEntryCard';

type Props = {
  entry: SelectionsEntry;
};

/** P4 — главная только про «моё»: «Продолжить чтение» и вход в подборки, которые живут отдельно —
 *  на своей странице (P4a, P4b) или вкладкой каталога источника (P4c). */
function HomeEntryPage({ entry }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <Stack gap="xl">
      <HomePageTitle />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      {entry === SELECTIONS_ENTRY.LINK ? (
        <Paper
          component={Link}
          to={DISCOVER_PATH}
          withBorder
          radius="md"
          p="md"
          c="inherit"
          td="none"
        >
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="sm" wrap="nowrap" miw={0}>
              <SparkleIcon size={24} color="var(--mantine-primary-color-filled)" />
              <Stack gap={2} miw={0}>
                <Text fw={600}>Подборки источников</Text>
                <Text fz="sm" c="dimmed">
                  Новинки, популярное и обновления с главных страниц сайтов
                </Text>
              </Stack>
            </Group>
            <ArrowRightIcon />
          </Group>
        </Paper>
      ) : (
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Title order={4}>Подборки источников</Title>
            {entry === SELECTIONS_ENTRY.CARDS && (
              <Anchor component={Link} to={DISCOVER_PATH} fz="sm" flex="none">
                <Group gap={4} wrap="nowrap">
                  Все подборки
                  <ArrowRightIcon />
                </Group>
              </Anchor>
            )}
          </Group>
          <SimpleGrid cols={isPhone ? 2 : 4} spacing="md">
            {MOCK_HOME_ALL.map((home) => (
              <SourceEntryCard
                key={home.source.id}
                home={home}
                to={
                  entry === SELECTIONS_ENTRY.CARDS
                    ? `${DISCOVER_PATH}/${home.source.id}`
                    : generatePath(ROUTE_PATHS.CATALOG, { sourceId: home.source.id })
                }
              />
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}

export default HomeEntryPage;
