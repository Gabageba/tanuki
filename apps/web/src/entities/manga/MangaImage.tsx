import { Box, Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import MangaScoreBadge from './badge/MangaScoreBadge';
import { type Manga } from '@tanuki/contracts';
import MangaAdultBadge from './badge/MangaAdultBadge';
import styles from './MangaCard.module.scss';

type Props = {
  manga: Manga;
};

function MangaImage({ manga }: Props) {
  const [isCoverBroken, setIsCoverBroken] = useState(false);
  const [isCoverLoading, setIsCoverLoading] = useState(true);

  return (
    <Box pos="relative" className={styles.wrapper}>
      <MangaAdultBadge contentRating={manga.contentRating} />
      <MangaScoreBadge manga={manga} />
      {isCoverBroken || !manga.coverUrl ? (
        <Paper>
          <Center className={styles.cover} c="dimmed">
            <ImageBrokenIcon size={38} />
          </Center>
        </Paper>
      ) : (
        <>
          {isCoverLoading && <Skeleton className={styles.cover} pos="absolute" inset={0} />}
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            loading="lazy"
            decoding="async"
            className={`${styles.cover} ${styles.image}`}
            style={isCoverLoading ? { visibility: 'hidden' } : undefined}
            onLoad={() => setIsCoverLoading(false)}
            onError={() => setIsCoverBroken(true)}
          />
        </>
      )}
    </Box>
  );
}

export default MangaImage;
