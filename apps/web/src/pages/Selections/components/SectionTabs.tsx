import { Box, Scroller, Tabs, Text } from '@mantine/core';
import type { HomeSectionInfo } from '@tanuki/contracts';
import { getHomeSectionKindIcon } from '../lib';

type Props = {
  sections: HomeSectionInfo[];
  activeId: string;
  onChange: (sectionId: string) => void;
};

/**
 * Вкладки блоков источника (T1): иконка по смыслу блока и название, как у сайта; строка листается
 * вбок, как папки закладок. Один блок — одна вкладка (Z1a): шапка одинакова у всех источников.
 */
function SectionTabs({ sections, activeId, onChange }: Props) {
  return (
    <Tabs value={activeId} onChange={(value) => value && onChange(value)}>
      <Tabs.List style={{ flexWrap: 'nowrap' }}>
        <Box flex={1} miw={0}>
          <Scroller>
            {sections.map((section) => (
              <Tabs.Tab
                key={section.id}
                value={section.id}
                leftSection={getHomeSectionKindIcon(section.kind)}
              >
                <Text inherit style={{ whiteSpace: 'nowrap' }}>
                  {section.title}
                </Text>
              </Tabs.Tab>
            ))}
          </Scroller>
        </Box>
      </Tabs.List>
    </Tabs>
  );
}

export default SectionTabs;
