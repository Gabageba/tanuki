import { Group, Text } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import NewChapterUpdateMeta from './NewChapterUpdateMeta';

type Props = { bookmark: BookmarkItem };

function NewChapterDetails({ bookmark }: Props) {
  return (
    <Group gap={8} align="baseline">
      <Text
        fz="sm"
        fw={600}
        ff="monospace"
        c="var(--mantine-primary-color-filled)"
        lh="tight"
        style={{ whiteSpace: 'nowrap' }}
      >
        +{bookmark.newChaptersCount}&nbsp;гл.
      </Text>
      <NewChapterUpdateMeta bookmark={bookmark} />
    </Group>
  );
}

export default NewChapterDetails;
