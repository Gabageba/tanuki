import { useState } from 'react';
import { ActionIcon, Box, Button, Group, NavLink, Stack, Title } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon, CheckIcon } from '@phosphor-icons/react';
import { SEARCH_FILTER_GROUPS } from '../lib';
import { PRESET_FILTERS, type SearchFilters } from '../models';
import CatalogGroupTitle from './CatalogGroupTitle';
import CatalogOptionsGrid from './CatalogOptionsGrid';
import CatalogSelectedCount from './CatalogSelectedCount';

/** F6 на телефоне — открытый drawer, копия `CatalogFilterDrawer`: «Все фильтры» списком групп,
 *  тап по группе открывает её с кнопкой назад. Показан развёрнутым прямо в рамке. */
function CatalogLikeSheet() {
  const [draft, setDraft] = useState<SearchFilters>(PRESET_FILTERS);
  const [activeKey, setActiveKey] = useState<keyof SearchFilters | null>(null);
  const activeGroup = SEARCH_FILTER_GROUPS.find(({ key }) => key === activeKey);

  return (
    <Stack gap="sm" mih={480}>
      <Box mx="auto" w={36} h={4} bdrs="xl" bg="var(--mantine-color-default-border)" />
      <Group gap={4}>
        {activeGroup && (
          <ActionIcon variant="subtle" color="gray" onClick={() => setActiveKey(null)}>
            <CaretLeftIcon />
          </ActionIcon>
        )}
        <Title order={5}>{activeGroup ? activeGroup.title : 'Все фильтры'}</Title>
        {activeGroup && <CatalogSelectedCount count={draft[activeGroup.key].length} />}
      </Group>
      <Box flex={1}>
        {activeGroup ? (
          <CatalogOptionsGrid
            group={activeGroup}
            value={draft[activeGroup.key]}
            onChange={(value) => setDraft({ ...draft, [activeGroup.key]: value })}
            cols={1}
          />
        ) : (
          SEARCH_FILTER_GROUPS.map((group) => (
            <NavLink
              key={group.key}
              label={<CatalogGroupTitle group={group} />}
              description={<CatalogSelectedCount count={draft[group.key].length} empty="Любой" />}
              rightSection={<CaretRightIcon />}
              onClick={() => setActiveKey(group.key)}
            />
          ))
        )}
      </Box>
      <Group justify="flex-end">
        <Button flex={1} variant="subtle" color="gray">
          Отменить
        </Button>
        <Button flex={1} leftSection={<CheckIcon />}>
          Применить
        </Button>
      </Group>
    </Stack>
  );
}

export default CatalogLikeSheet;
