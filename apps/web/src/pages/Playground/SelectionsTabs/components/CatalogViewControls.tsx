import { Group } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import type { ViewMode } from '@/shared/lib/viewMode';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import { CATALOG_LINK, type CatalogLink } from '../models';
import CatalogLinkControl from './CatalogLinkControl';

type Props = {
  source: Source;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  /** Ось C — вид перехода в каталог. */
  catalog?: CatalogLink;
};

/** Переход в каталог (ось C) и переключатель сетка/список: блок теперь сетка, как каталог, и вид
 *  снова имеет смысл. */
function CatalogViewControls({
  source,
  viewMode,
  onViewModeChange,
  catalog = CATALOG_LINK.ARROW,
}: Props) {
  return (
    <Group gap="md" wrap="nowrap" flex="none">
      <CatalogLinkControl source={source} look={catalog} />
      <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />
    </Group>
  );
}

export default CatalogViewControls;
