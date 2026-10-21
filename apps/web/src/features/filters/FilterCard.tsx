import { Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import { countGroupSelections, isExcludableGroup } from './lib/filterSelection';
import { calcFilterMah } from './lib/calcFilterMah';
import useExclusiveFilterConfirm from './hooks/useExclusiveFilterConfirm';
import FilterRender from './FilterRender';
import FilterGroupTitle from './FilterGroupTitle';
import SelectedFiltersCount from './SelectedFiltersCount';
import ExclusiveFilterConfirmModal from './ExclusiveFilterConfirmModal';
import styles from './Filter.module.scss';

type Props = {
  groups: FilterGroup[];
  selection: FilterSelection[];
  onClose: () => void;
  onChange: (selection: FilterSelection[]) => void;
};

function FilterCard({ groups, selection, onClose, onChange }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(selection);
  const { applyChange, pending, confirmPending, cancelPending } = useExclusiveFilterConfirm();
  const { ref: listRef, height: listHeight } = useElementSize<HTMLDivElement>();
  const scrollMah = calcFilterMah(listHeight);

  return (
    <>
      <Card withBorder p={0} visibleFrom="sm">
        <Tabs
          defaultValue={groups[0]?.id}
          orientation="vertical"
          classNames={{ tab: styles.tab, list: styles.list }}
          radius={0}
          keepMounted
        >
          <Tabs.List w={270}>
            {/* Measured separately from Tabs.List itself, which stays stretched to the panel's
              height so the list/panel divider reaches all the way down — see Filter.module.scss. */}
            <div ref={listRef}>
              {groups.map((group) => {
                const { included, excluded } = countGroupSelections(draft, group.id);

                return (
                  <Tabs.Tab key={group.id} value={group.id} w="100%">
                    <Group justify="space-between">
                      <FilterGroupTitle group={group} />
                      {(included || excluded) && (
                        <Group mt={1} gap={8}>
                          {!!included && (
                            <Text fz={12} c={isExcludableGroup(group) ? 'green' : 'terracotta'}>
                              {included}
                            </Text>
                          )}
                          {!!excluded && (
                            <Text fz={12} c="red">
                              -{excluded}
                            </Text>
                          )}
                        </Group>
                      )}
                    </Group>
                  </Tabs.Tab>
                );
              })}
            </div>
          </Tabs.List>
          {groups?.map((group) => (
            <Tabs.Panel key={group.id} value={group.id} p={'var(--mantine-spacing-sm)'} miw={0}>
              <Stack h="100%">
                <Group>
                  <Title order={4}>{group.title}</Title>
                  <SelectedFiltersCount group={group} draft={draft} mt={2} />
                </Group>
                <FilterRender
                  group={group}
                  selection={draft}
                  onChange={(next) => applyChange(groups, group, draft, next, setDraft)}
                  scrollAreaProps={{ mah: scrollMah }}
                />
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    leftSection={<CheckIcon />}
                    onClick={() => {
                      onChange(draft);
                      onClose();
                    }}
                  >
                    {t('apply')}
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

export default FilterCard;
