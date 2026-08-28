import { Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { useState } from 'react';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { countGroupSelections } from '../../utils/filterSelection';
import useExclusiveFilterConfirm from '../../hooks/useExclusiveFilterConfirm';
import CatalogFilterRender from './CatalogFilterRender';
import CatalogFilterGroupTitle from './CatalogFilterGroupTitle';
import SelectedCatalogFiltersCount from './SelectedCatalogFiltersCount';
import ExclusiveFilterConfirmModal from './ExclusiveFilterConfirmModal';
import styles from './CatalogFilter.module.scss';

type Props = {
  groups: FilterGroup[];
  selection: FilterSelection[];
  onClose: () => void;
  onChange: (selection: FilterSelection[]) => void;
};

function CatalogFilterCard({ groups, selection, onClose, onChange }: Props) {
  const [draft, setDraft] = useState(selection);
  const { applyChange, pending, confirmPending, cancelPending } = useExclusiveFilterConfirm();

  return (
    <>
      <Card withBorder p={0} visibleFrom="sm">
        <Tabs
          defaultValue={groups[0]?.id}
          orientation="vertical"
          classNames={{ tab: styles.tab }}
          radius={0}
          keepMounted={false}
        >
          <Tabs.List w={{ base: 200, md: 250 }}>
            {groups.map((group) => {
              const { included, excluded } = countGroupSelections(draft, group.id);

              return (
                <Tabs.Tab key={group.id} value={group.id}>
                  <Group justify="space-between">
                    <CatalogFilterGroupTitle group={group} />
                    {(included || excluded) && (
                      <Group mt={1} fz={12} gap={8}>
                        {!!included && <Text c="terracotta">{included}</Text>}
                        {!!excluded && <Text c="red">-{excluded}</Text>}
                      </Group>
                    )}
                  </Group>
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
          {groups?.map((group) => (
            <Tabs.Panel key={group.id} value={group.id} p={'var(--mantine-spacing-sm)'}>
              <Stack h="100%">
                <Group>
                  <Title order={4}>{group.title}</Title>
                  <SelectedCatalogFiltersCount groupId={group.id} draft={draft} mt={2} />
                </Group>
                <CatalogFilterRender
                  group={group}
                  selection={draft}
                  onChange={(next) => applyChange(groups, group, draft, next, setDraft)}
                  scrollAreaProps={{ mah: 420 }}
                />
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Отменить
                  </Button>
                  <Button
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
      <ExclusiveFilterConfirmModal
        opened={!!pending}
        groupTitle={pending?.group.title}
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </>
  );
}

export default CatalogFilterCard;
