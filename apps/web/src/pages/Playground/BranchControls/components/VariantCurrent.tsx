import { Group, Stack } from '@mantine/core';
import useDemoState from '../hooks/useDemoState';
import BranchTabs from './BranchTabs';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

/** B0 — разметка TitleChaptersTabContent как есть. */
function VariantCurrent() {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();

  return (
    <Stack gap="sm">
      <BranchTabs branches={branches} value={branch.id} onChange={setBranchId} withIcon={false} />
      <Group justify="space-between" gap="sm">
        <SortButton direction={direction} onChange={setDirection} />
        <DownloadAllButton withIcon={false} />
      </Group>
      <ChaptersPreview branch={branch} direction={direction} />
    </Stack>
  );
}

export default VariantCurrent;
