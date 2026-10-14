import { use } from 'react';
import { Group, SimpleGrid, Stack, Title } from '@mantine/core';
import SearchInput from '@/shared/ui/SearchInput';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';
import { OFFLINE_CATALOG_TITLES } from '../mocks';
import { OFFLINE_CATALOG, type OfflineCatalog } from '../models';
import DisabledFiltersMock from './DisabledFiltersMock';
import OfflineNote from './OfflineNote';
import OfflineTitleCard from './OfflineTitleCard';

type Props = {
  variant: OfflineCatalog;
};

/** Каталог Mangalib без сети: только скачанные тайтлы источника, поиск по названию остаётся. */
function OfflineCatalogMock({ variant }: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);

  return (
    <Stack gap="md">
      <Title order={3}>
        {variant === OFFLINE_CATALOG.HEADING ? 'Скачанное из Mangalib' : 'Mangalib'}
      </Title>
      <Group gap="xs" wrap={isPhone ? 'wrap' : 'nowrap'} align="flex-start">
        <SearchInput placeholder="Название тайтла" allowClear flex={1} miw={200} />
        {variant === OFFLINE_CATALOG.DISABLED_FILTERS && <DisabledFiltersMock />}
      </Group>
      {variant === OFFLINE_CATALOG.NOTE && (
        <OfflineNote>Нет сети — показаны скачанные тайтлы этого источника</OfflineNote>
      )}
      <SimpleGrid cols={isPhone ? 2 : 5} spacing="sm">
        {OFFLINE_CATALOG_TITLES.map((title) => (
          <OfflineTitleCard key={title.id} title={title} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default OfflineCatalogMock;
