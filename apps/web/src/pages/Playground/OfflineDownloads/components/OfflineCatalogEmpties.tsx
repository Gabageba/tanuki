import { EmptyState, Paper, SimpleGrid } from '@mantine/core';
import { MagnifyingGlassIcon, TrayIcon } from '@phosphor-icons/react';

/** Пустые состояния каталога и поиска без сети — общие для вариантов K. */
function OfflineCatalogEmpties() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" maw={1100}>
      <Paper withBorder radius="md" p="md">
        <EmptyState
          title="Из этого источника ничего не скачано"
          description="Без сети каталог показывает только скачанные тайтлы"
          icon={<TrayIcon />}
        />
      </Paper>
      <Paper withBorder radius="md" p="md">
        <EmptyState
          title="Среди скачанного не нашлось"
          description="Без сети поиск идёт только по скачанным тайтлам"
          icon={<MagnifyingGlassIcon />}
        />
      </Paper>
    </SimpleGrid>
  );
}

export default OfflineCatalogEmpties;
