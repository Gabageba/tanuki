import { useState } from 'react';
import { Box, Button, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { PRESET_FILTERS } from '../models';
import FilterGroupsStack from './FilterGroupsStack';

/** Drawer «Фильтры» на телефоне, открытый: группы столбиком, «Отмена» и «Применить» внизу —
 *  как `CatalogFilterDrawer`. Показан развёрнутым прямо в рамке, без затемнения страницы. */
function FiltersSheetMock() {
  const [draft, setDraft] = useState(PRESET_FILTERS);

  return (
    <Stack gap="sm">
      <Box mx="auto" w={36} h={4} bdrs="xl" bg="var(--mantine-color-default-border)" />
      <Text fw={600}>Фильтры</Text>
      <ScrollArea.Autosize mah={420}>
        <FilterGroupsStack filters={draft} onChange={setDraft} />
      </ScrollArea.Autosize>
      <Group grow>
        <Button variant="subtle" color="gray">
          Отмена
        </Button>
        <Button leftSection={<CheckIcon />}>Применить</Button>
      </Group>
    </Stack>
  );
}

export default FiltersSheetMock;
