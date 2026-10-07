import { ActionIcon, Box, Group, Indicator, Scroller, Tabs, Text, Tooltip } from '@mantine/core';
import { FolderSimplePlusIcon, GearSixIcon } from '@phosphor-icons/react';
import { formatNewCount } from '../lib';
import { TAB_COUNTER, type ResolvedFolder, type TabCounter } from '../models';
import FolderGlyph from './FolderGlyph';

type Props = {
  folders: ResolvedFolder[];
  counter: TabCounter;
  activeId: string;
  onChange: (id: string) => void;
  /** A1 — «Новая папка» и настройки в конце полосы. */
  withActions?: boolean;
};

/** Полоса вкладок-папок как в `pages/Settings`: прокручивается вбок, длинное название обрезано. */
function FolderTabs({ folders, counter, activeId, onChange, withActions = false }: Props) {
  return (
    <Tabs value={activeId} onChange={(value) => value && onChange(value)}>
      <Tabs.List style={{ flexWrap: 'nowrap' }}>
        <Box flex={1} miw={0}>
          <Scroller>
            {folders.map((folder) => {
              const hasNew = folder.trackUpdates && folder.newCount > 0;

              return (
                <Tabs.Tab
                  key={folder.id}
                  value={folder.id}
                  leftSection={
                    counter === TAB_COUNTER.COUNT_DOT ? (
                      <Indicator size={7} offset={1} disabled={!hasNew}>
                        <FolderGlyph folder={folder} />
                      </Indicator>
                    ) : (
                      <FolderGlyph folder={folder} />
                    )
                  }
                >
                  <Group gap={6} wrap="nowrap">
                    <Text inherit truncate maw={160} title={folder.name}>
                      {folder.name}
                    </Text>
                    <Text inherit ff="monospace" c="dimmed" fz={12}>
                      {folder.count}
                    </Text>
                    {counter === TAB_COUNTER.COUNT_NEW && hasNew && (
                      <Text
                        inherit
                        ff="monospace"
                        fz={12}
                        fw={600}
                        c="var(--mantine-primary-color-filled)"
                      >
                        {formatNewCount(folder.newCount)}
                      </Text>
                    )}
                  </Group>
                </Tabs.Tab>
              );
            })}
          </Scroller>
        </Box>
        {withActions && (
          <Group gap={2} wrap="nowrap" pl="xs" flex="none">
            <Tooltip label="Новая папка">
              <ActionIcon variant="subtle" color="gray" aria-label="Новая папка">
                <FolderSimplePlusIcon />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Управлять папками">
              <ActionIcon variant="subtle" color="gray" aria-label="Управлять папками">
                <GearSixIcon />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Tabs.List>
    </Tabs>
  );
}

export default FolderTabs;
