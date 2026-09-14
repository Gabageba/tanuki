import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import { type Manga } from '@tanuki/contracts';
import MangaAdultBadge from '../markers/MangaAdultBadge';
import MangaScoreBadge from '../markers/MangaScoreBadge';
import MangaImage from '../MangaImage';
import MangaSourceRibbon from '../markers/MangaSourceRibbon';
import styles from '../Manga.module.scss';

type Props = {
  manga: Manga;
  showBadges?: boolean;
  showSource?: boolean;
} & Omit<BoxProps, 'pos' | 'className'>;

function MangaCardImage({ manga, showBadges = false, showSource = false, ...restProps }: Props) {
  return (
    <Box pos="relative" className={styles.imageWrapper} {...restProps}>
      {showSource && <MangaSourceRibbon sourceId={manga.sourceId as SourceId} />}
      {showBadges && (
        <>
          <MangaAdultBadge contentRating={manga.contentRating} />
          <MangaScoreBadge manga={manga} />
        </>
      )}
      <MangaImage manga={manga} imageClassName={styles.image} />
    </Box>
  );
}

export default MangaCardImage;
