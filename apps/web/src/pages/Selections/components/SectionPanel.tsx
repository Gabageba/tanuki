import { Box, Group } from '@mantine/core';
import type { HomeSectionInfo, HomeSectionPeriod } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import PeriodSelect from './PeriodSelect';

type Props = {
  section: HomeSectionInfo;
  period: HomeSectionPeriod;
  onPeriodChange: (period: HomeSectionPeriod) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

/**
 * Панель над сеткой (H3 + P2): слева фильтры блока — пока это только период, — справа сетка или
 * список. У блока без фильтров остаётся один вид, высота строки между вкладками не меняется.
 */
function SectionPanel({ section, period, onPeriodChange, viewMode, onViewModeChange }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Box flex={1} miw={0}>
        {section.isPeriodSupported && <PeriodSelect value={period} onChange={onPeriodChange} />}
      </Box>
      <Box flex="none">
        <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />
      </Box>
    </Group>
  );
}

export default SectionPanel;
