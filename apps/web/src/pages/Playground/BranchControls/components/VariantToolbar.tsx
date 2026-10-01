import { Group, Stack } from '@mantine/core';
import useDemoState from '../hooks/useDemoState';
import BranchSelect from './BranchSelect';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

type Props = {
  narrow: boolean;
};

/** B5 — вся панель списка в его шапке: ветка полем, сортировка, скачивание. */
function VariantToolbar({ narrow }: Props) {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();
  const select = (
    <BranchSelect
      branches={branches}
      value={branch.id}
      onChange={setBranchId}
      size="xs"
      w={narrow ? '100%' : 300}
    />
  );
  const sort = <SortButton size="xs" direction={direction} onChange={setDirection} />;
  const download = <DownloadAllButton size="xs" variant="light" />;

  return (
    <ChaptersPreview
      branch={branch}
      direction={direction}
      header={
        narrow ? (
          <Stack gap="xs">
            {select}
            <Group justify="space-between" gap="sm">
              {sort}
              {download}
            </Group>
          </Stack>
        ) : (
          <Group gap="sm" wrap="nowrap">
            {select}
            {sort}
            <Group ml="auto">{download}</Group>
          </Group>
        )
      }
    />
  );
}

export default VariantToolbar;
