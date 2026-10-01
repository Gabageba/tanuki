import { Group, Stack } from '@mantine/core';
import useDemoState from '../hooks/useDemoState';
import BranchTabs from './BranchTabs';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

/** B3 — ветки снаружи, действия в шапке карточки списка. */
function VariantListHeader() {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();

  return (
    <Stack gap="sm">
      <BranchTabs branches={branches} value={branch.id} onChange={setBranchId} />
      <ChaptersPreview
        branch={branch}
        direction={direction}
        header={
          <Group justify="space-between" gap="sm">
            <SortButton size="xs" direction={direction} onChange={setDirection} />
            <DownloadAllButton size="xs" variant="light" />
          </Group>
        }
      />
    </Stack>
  );
}

export default VariantListHeader;
