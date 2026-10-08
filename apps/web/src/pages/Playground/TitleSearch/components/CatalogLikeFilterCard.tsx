import { useState } from 'react';
import { Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { SEARCH_FILTER_GROUPS } from '../lib';
import type { SearchFilters } from '../models';
import CatalogGroupTitle from './CatalogGroupTitle';
import CatalogOptionsGrid from './CatalogOptionsGrid';
import CatalogSelectedCount from './CatalogSelectedCount';
import styles from '../TitleSearch.module.scss';

type Props = {
  filters: SearchFilters;
  onClose: () => void;
  onChange: (filters: SearchFilters) => void;
};

/** F6 — копия `CatalogFilterCard`: вертикальные вкладки групп со счётчиком выбранного, справа
 *  группа целиком; выбор копится в черновике и уходит по «Применить». */
function CatalogLikeFilterCard({ filters, onClose, onChange }: Props) {
  const [draft, setDraft] = useState(filters);

  return (
    <Card withBorder p={0}>
      <Tabs
        defaultValue={SEARCH_FILTER_GROUPS[0]?.key}
        orientation="vertical"
        classNames={{ tab: styles.catalogTab, list: styles.catalogTabList }}
        radius={0}
        keepMounted
      >
        <Tabs.List w={270}>
          {SEARCH_FILTER_GROUPS.map((group) => (
            <Tabs.Tab key={group.key} value={group.key} w="100%">
              <Group justify="space-between">
                <CatalogGroupTitle group={group} />
                {draft[group.key].length > 0 && (
                  <Text fz={12} c="terracotta" mt={1}>
                    {draft[group.key].length}
                  </Text>
                )}
              </Group>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {SEARCH_FILTER_GROUPS.map((group) => (
          <Tabs.Panel key={group.key} value={group.key} p="sm" miw={0}>
            <Stack h="100%">
              <Group>
                <Title order={4}>{group.title}</Title>
                <CatalogSelectedCount count={draft[group.key].length} mt={2} />
              </Group>
              <CatalogOptionsGrid
                group={group}
                value={draft[group.key]}
                onChange={(value) => setDraft({ ...draft, [group.key]: value })}
                cols={2}
              />
              <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={onClose}>
                  Отменить
                </Button>
                <Button
                  leftSection={<CheckIcon />}
                  onClick={() => {
                    onChange(draft);
                    onClose();
                  }}
                >
                  Применить
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Card>
  );
}

export default CatalogLikeFilterCard;
