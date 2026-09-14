import { Center, Image, Paper, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import { type Manga } from '@tanuki/contracts';
import styles from './Manga.module.scss';

type Props = {
  manga: Manga;
  imageClassName?: string;
};

function MangaImage({ manga, imageClassName }: Props) {
  const [isCoverBroken, setIsCoverBroken] = useState(false);
  const [isCoverLoading, setIsCoverLoading] = useState(true);

  return (
    <>
      {isCoverBroken || !manga.coverUrl ? (
        <Paper h="100%">
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
            className={`${styles.cover}${imageClassName ? ' ' + imageClassName : ''}`}
            style={isCoverLoading ? { visibility: 'hidden' } : undefined}
            onLoad={() => setIsCoverLoading(false)}
            onError={() => setIsCoverBroken(true)}
          />
        </>
      )}
    </>
  );
}

export default MangaImage;
