import { Group, Radio, Scroller, Stack, Text } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import { formatChaptersCount, getBranchName } from '../lib';
import useDemoState from '../hooks/useDemoState';
import ChaptersPreview from './ChaptersPreview';
import DownloadAllButton from './DownloadAllButton';
import SortButton from './SortButton';

type Props = {
  narrow: boolean;
};

/** B4 — ветки двухстрочными карточками: имя, под ним число глав и свежесть. */
function VariantCards({ narrow }: Props) {
  const { branches, branch, setBranchId, direction, setDirection } = useDemoState();
  const { formatRelative } = useDateFormat();

  return (
    <Stack gap="sm">
      <Radio.Group value={branch.id} onChange={setBranchId}>
        <Scroller>
          <Group gap={8} wrap="nowrap" align="stretch">
            {branches.map((item) => (
              <Radio.Card
                key={item.id}
                value={item.id}
                variant="tile"
                w={narrow ? 168 : 200}
                px="sm"
                py={8}
                flex="none"
              >
                <Stack gap={2}>
                  <Text fz="sm" fw={500} lineClamp={1}>
                    {getBranchName(item)}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    <Text fz={12} ff="monospace" c="dimmed">
                      {formatChaptersCount(item.chaptersCount)}
                    </Text>
                    <Text fz={12} c="dimmed">
                      ·
                    </Text>
                    <Text fz={12} c="dimmed" truncate>
                      {item.lastUpdatedAt ? formatRelative(item.lastUpdatedAt) : <Mdash />}
                    </Text>
                  </Group>
                </Stack>
              </Radio.Card>
            ))}
          </Group>
        </Scroller>
      </Radio.Group>
      <Group justify="space-between" gap="sm">
        <SortButton direction={direction} onChange={setDirection} />
        <DownloadAllButton />
      </Group>
      <ChaptersPreview branch={branch} direction={direction} />
    </Stack>
  );
}

export default VariantCards;
