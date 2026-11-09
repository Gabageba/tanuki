import { Box } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = { bookmark: BookmarkItem };

function NewChapterUpdateMeta({ bookmark }: Props) {
  const { formatRelative } = useDateFormat();

  return (
    <TitleMetaItems
      gap={4}
      items={[
        bookmark.latestChapterNumber !== null && (
          <Box key="chapter" component="span" ff="monospace" lh="tight">
            Гл.&nbsp;{bookmark.latestChapterNumber}
          </Box>
        ),
        bookmark.latestNewAt && formatRelative(bookmark.latestNewAt),
      ]}
    />
  );
}

export default NewChapterUpdateMeta;
