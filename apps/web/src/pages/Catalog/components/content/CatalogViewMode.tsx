import PageLayout from '@/shared/ui/PageLayout';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import type { CatalogParams } from '../../models';
import { setStoredViewMode, VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';

function CatalogViewMode() {
  const { params, setParams } = PageLayout.useParams<CatalogParams>();

  const handleChange = (viewMode: ViewMode) => {
    setStoredViewMode(viewMode);
    setParams({ ...params, viewMode });
  };

  return <ViewModeSwitch value={params.viewMode ?? VIEW_MODE.GRID} onChange={handleChange} />;
}

export default CatalogViewMode;
