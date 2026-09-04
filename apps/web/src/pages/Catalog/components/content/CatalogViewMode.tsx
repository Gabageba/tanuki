import { SegmentedControl } from '@mantine/core';
import { RowsIcon, SquaresFourIcon } from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams } from '../../models';
import { setStoredViewMode, VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';

function CatalogViewMode() {
  const { params, setParams } = PageLayout.useParams<CatalogParams>();

  const viewMode = params.viewMode ?? VIEW_MODE.GRID;

  const handleChange = (value: string) => {
    const nextViewMode = value as ViewMode;
    setStoredViewMode(nextViewMode);
    setParams({ ...params, viewMode: nextViewMode });
  };

  return (
    <SegmentedControl
      value={viewMode}
      onChange={handleChange}
      data={[
        { label: <SquaresFourIcon size={18} />, value: VIEW_MODE.GRID },
        { label: <RowsIcon size={18} />, value: VIEW_MODE.LIST },
      ]}
    />
  );
}

export default CatalogViewMode;
