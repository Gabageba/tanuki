import { Box, Group } from '@mantine/core';
import { VIEW_MODE, type SortOrder, type HomeSectionInfo } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import CoverlessSectionPanel from './CoverlessSectionPanel';
import SectionVariantSelect from './SectionVariantSelect';

type Props = {
  section: HomeSectionInfo;
  order?: SortOrder;
  onOrderChange: (order: SortOrder) => void;
  variant: string;
  onVariantChange: (variant: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

/**
 * Панель над сеткой (H3 + P2): слева переключатель блока — период, страна, — справа сетка или
 * список. У блока без вариантов остаётся один вид, высота строки между вкладками не меняется.
 */
function SectionPanel({
  section,
  variant,
  onVariantChange,
  viewMode,
  onViewModeChange,
  order,
  onOrderChange,
}: Props) {
  switch (viewMode) {
    case VIEW_MODE.COVERLESS:
      return (
        <CoverlessSectionPanel
          section={section}
          variant={variant}
          order={order}
          onVariantChange={onVariantChange}
          onOrderChange={onOrderChange}
        />
      );
    case VIEW_MODE.GRID:
    case VIEW_MODE.LIST:
      return (
        <Group justify="space-between" wrap="nowrap" gap="md">
          <Box flex={1} miw={0}>
            <SectionVariantSelect section={section} value={variant} onChange={onVariantChange} />
          </Box>
          <Box flex="none">
            <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />
          </Box>
        </Group>
      );
  }
}

export default SectionPanel;
