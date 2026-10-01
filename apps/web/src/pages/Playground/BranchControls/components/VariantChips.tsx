import { Chip, Divider, Group, Stack, Text } from '@mantine/core';
import { formatChaptersCount, getBranchName } from '../lib';
import useDemoState from '../hooks/useDemoState';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

/** B2 — ветки пилюлями под подписью, действия отчёркнуты линией. */
function VariantChips() {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();

  return (
    <Stack gap="sm">
      <Stack gap={6}>
        <Text fz={12} c="dimmed">
          Ветка перевода
        </Text>
        <Chip.Group value={branch.id} onChange={setBranchId}>
          <Group gap={6}>
            {branches.map((item) => (
              <Chip key={item.id} value={item.id} radius="xl" size="sm" variant="light">
                {getBranchName(item)}
                <Text span inherit c="dimmed" ml={6}>
                  {formatChaptersCount(item.chaptersCount)}
                </Text>
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>
      <Divider />
      <Group justify="space-between" gap="sm">
        <SortButton direction={direction} onChange={setDirection} />
        <DownloadAllButton />
      </Group>
      <ChaptersPreview branch={branch} direction={direction} />
    </Stack>
  );
}

export default VariantChips;
