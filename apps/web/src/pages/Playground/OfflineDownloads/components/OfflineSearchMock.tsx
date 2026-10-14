import { Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DOWNLOADED_TITLES } from '../mocks';
import { OFFLINE_CATALOG, type OfflineCatalog } from '../models';
import DisabledFiltersMock from './DisabledFiltersMock';
import OfflineNote from './OfflineNote';
import OfflineTitleCard from './OfflineTitleCard';

type Props = {
  variant: OfflineCatalog;
};

const QUERY = 'ва';
const FOUND = DOWNLOADED_TITLES.filter((title) => title.name.toLowerCase().includes(QUERY));
const SOURCES = [...new Set(FOUND.map((title) => title.source))];

/** /search без сети: подстрока по названиям скачанного, группы по источникам, как онлайн. */
function OfflineSearchMock({ variant }: Props) {
  return (
    <Stack gap="md">
      <Title order={3}>
        {variant === OFFLINE_CATALOG.HEADING ? `Среди скачанного: «${QUERY}»` : `Поиск: «${QUERY}»`}
      </Title>
      {variant === OFFLINE_CATALOG.DISABLED_FILTERS && <DisabledFiltersMock />}
      {variant === OFFLINE_CATALOG.NOTE && (
        <OfflineNote>Нет сети — поиск идёт только по скачанным тайтлам</OfflineNote>
      )}
      {SOURCES.map((source) => {
        const titles = FOUND.filter((title) => title.source === source);
        return (
          <Stack key={source} gap="xs">
            <Group gap="xs">
              <Text fw={600}>{source}</Text>
              <Text c="dimmed" ff="monospace" fz="sm">
                {titles.length}
              </Text>
            </Group>
            <SimpleGrid cols={5} spacing="sm">
              {titles.map((title) => (
                <OfflineTitleCard key={title.id} title={title} />
              ))}
            </SimpleGrid>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default OfflineSearchMock;
