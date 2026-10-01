import { Group, Stack } from '@mantine/core';
import useDemoState from '../hooks/useDemoState';
import BranchSelect from './BranchSelect';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

type Props = {
  narrow: boolean;
};

/** B1 — ветка полем выбора, в одной строке с действиями. */
function VariantSelect({ narrow }: Props) {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();
  const actions = (
    <>
      <SortButton direction={direction} onChange={setDirection} />
      <DownloadAllButton />
    </>
  );

  return (
    <Stack gap="sm">
      {narrow ? (
        <>
          <BranchSelect branches={branches} value={branch.id} onChange={setBranchId} />
          <Group justify="space-between" gap="sm">
            {actions}
          </Group>
        </>
      ) : (
        <Group gap="sm" wrap="nowrap">
          <BranchSelect branches={branches} value={branch.id} onChange={setBranchId} w={340} />
          <SortButton direction={direction} onChange={setDirection} />
          <Group ml="auto">
            <DownloadAllButton />
          </Group>
        </Group>
      )}
      <ChaptersPreview branch={branch} direction={direction} />
    </Stack>
  );
}

export default VariantSelect;
