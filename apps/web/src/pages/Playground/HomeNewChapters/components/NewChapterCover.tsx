import { Box } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import useIsAdultTitleHidden from '@/entities/title/hooks/useIsAdultTitleHidden';
import { TITLE_CARD_HIDDEN_BLUR } from '@/entities/title/card/TitleCard/models';
import CoverImage from '@/shared/ui/CoverImage';
import { COMPACT_COVER_WIDTH } from '../models';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = { bookmark: BookmarkItem };

/** Локальная обложка 64 px: общая TitleCard и её размеры не меняются. */
function NewChapterCover({ bookmark }: Props) {
  const isHidden = useIsAdultTitleHidden(bookmark);
  const blur = isHidden ? TITLE_CARD_HIDDEN_BLUR : 0;

  return (
    <Box
      data-card-cover
      className={styles.cover}
      pos="relative"
      w={COMPACT_COVER_WIDTH}
      mih={(COMPACT_COVER_WIDTH * 4) / 3}
      flex="none"
      bdrs="md"
      style={{ overflow: 'hidden' }}
    >
      <Box
        pos="absolute"
        inset={-2 * blur}
        style={isHidden ? { filter: `blur(${blur}px)` } : undefined}
      >
        <CoverImage src={bookmark.coverUrl} alt={bookmark.name} className={styles.image} />
      </Box>
      {isHidden && <HiddenCoverOverlay size={24} />}
    </Box>
  );
}

export default NewChapterCover;
