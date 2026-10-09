import { Badge, Box, Group } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceTitle from '@/entities/source/components/SourceTitle';
import AllResultsLink from './AllResultsLink';

type Props = {
  source: Source;
  /** S2 — сколько карточек пришло. */
  count?: number;
  /** S3 — ссылка уходит под карточки. */
  withLink?: boolean;
};

/** S1/S2/S3 — `SourceTitle` без статуса; «Все результаты» справа в той же строке. */
function SectionHeaderLink({ source, count, withLink = true }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap" miw={0}>
        <Box miw={0}>
          <SourceTitle source={source} />
        </Box>
        {count !== undefined && (
          <Badge variant="muted" color="gray" ff="monospace" flex="none">
            {count}
          </Badge>
        )}
      </Group>
      {withLink && <AllResultsLink source={source} />}
    </Group>
  );
}

export default SectionHeaderLink;
