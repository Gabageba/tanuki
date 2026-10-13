import { Box, Group, Scroller, Tabs, Text } from '@mantine/core';
import { getBlockKindIcon } from '../lib';
import { TABS_LOOK, type MockBlock, type TabsLook } from '../models';

type Props = {
  blocks: MockBlock[];
  activeId: string;
  onChange: (blockId: string) => void;
  look: TabsLook;
  /** E3 — у блока без продолжения число тайтлов на вкладке. */
  withFiniteCount: boolean;
};

/**
 * Вкладки блоков источника: иконка по смыслу блока и название, как у сайта. Строка листается
 * вбок, как вкладки-папки закладок. Названия не обрезаются — их и так приходится узнавать.
 */
function BlockTabs({ blocks, activeId, onChange, look, withFiniteCount }: Props) {
  const isPills = look === TABS_LOOK.PILLS;

  return (
    <Tabs
      value={activeId}
      onChange={(value) => value && onChange(value)}
      variant={isPills ? 'pills' : 'default'}
      radius={isPills ? 'xl' : undefined}
    >
      <Tabs.List style={{ flexWrap: 'nowrap' }}>
        <Box flex={1} miw={0}>
          <Scroller>
            <Group gap={isPills ? 6 : 0} wrap="nowrap">
              {blocks.map((block) => (
                <Tabs.Tab
                  key={block.id}
                  value={block.id}
                  leftSection={getBlockKindIcon(block.kind)}
                  rightSection={
                    withFiniteCount &&
                    block.pages === 1 && (
                      <Text inherit ff="monospace" c="dimmed" fz={12}>
                        {block.pageSize}
                      </Text>
                    )
                  }
                >
                  <Text inherit style={{ whiteSpace: 'nowrap' }}>
                    {block.title}
                  </Text>
                </Tabs.Tab>
              ))}
            </Group>
          </Scroller>
        </Box>
      </Tabs.List>
    </Tabs>
  );
}

export default BlockTabs;
