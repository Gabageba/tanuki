import { Box } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { CARD_VARIANT, type CombinedMetaVariant } from '../models';

type Props = { bookmark: BookmarkItem; variant: CombinedMetaVariant };

function NewChapterCombinedMeta({ bookmark, variant }: Props) {
  const { formatRelative } = useDateFormat();
  const getCountProps = () => {
    switch (variant) {
      case CARD_VARIANT.COMBINED_META:
        return { c: 'dimmed', fw: 400 };
      case CARD_VARIANT.COLORED_COUNT:
        return { c: 'var(--mantine-color-anchor)', fw: 400 };
      case CARD_VARIANT.BOLD_COLORED_COUNT:
        return { c: 'var(--mantine-color-anchor)', fw: 600 };
    }
  };
  const countProps = getCountProps();

  return (
    <TitleMetaItems
      gap={4}
      items={[
        <Box
          key="chapter"
          component="span"
          ff="monospace"
          lh="tight"
          style={{ whiteSpace: 'nowrap' }}
        >
          {bookmark.latestChapterNumber !== null ? (
            <>
              Гл.&nbsp;{bookmark.latestChapterNumber}&nbsp;
              <Box component="span" {...countProps}>
                (+{bookmark.newChaptersCount})
              </Box>
            </>
          ) : (
            <Box component="span" {...countProps}>
              +{bookmark.newChaptersCount}&nbsp;гл.
            </Box>
          )}
        </Box>,
        bookmark.latestNewAt && formatRelative(bookmark.latestNewAt),
      ]}
    />
  );
}

export default NewChapterCombinedMeta;
