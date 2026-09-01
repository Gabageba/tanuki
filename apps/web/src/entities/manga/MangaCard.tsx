import { Fragment, useState } from 'react';
import { Box, Center, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import { MANGA_TYPE, type Manga } from '@tanuki/contracts';
import MidDot from '@/shared/ui/MidDot';
import { getLabelByMangaType } from '../source/lib';
import MangaScoreBadge from './MangaScoreBadge';
import styles from './MangaCard.module.scss';

type Props = {
  manga: Manga;
};

function MangaCard({ manga }: Props) {
  const [isCoverBroken, setIsCoverBroken] = useState(false);

  const metaItems = [
    manga.type && getLabelByMangaType(manga.type),
    manga.year && String(manga.year),
    manga.chaptersCount && `${manga.chaptersCount} гл.`,
  ].filter((item): item is string => Boolean(item));

  return (
    <Link
      to={`/manga/${manga.sourceId}/${manga.id.slice(manga.sourceId.length + 1)}`}
      className={styles.card}
    >
      <Stack gap={8}>
        <Box pos="relative">
          <MangaScoreBadge manga={manga} />
          {isCoverBroken || !manga.coverUrl ? (
            <Paper>
              <Center className={styles.cover} c="dimmed">
                <ImageBrokenIcon size={38} />
              </Center>
            </Paper>
          ) : (
            <Image
              src={manga.coverUrl}
              alt={manga.title}
              loading="lazy"
              decoding="async"
              className={styles.cover}
              onError={() => setIsCoverBroken(true)}
            />
          )}
        </Box>

        <Stack gap={4}>
          <Group
            gap={manga.type === MANGA_TYPE.MANHUA && (manga.chaptersCount || 0) >= 1000 ? 2 : 4}
          >
            {metaItems.map((item, index) => (
              <Fragment key={item}>
                {index > 0 && (
                  <Text c="dimmed" fz={12} lh={1}>
                    <MidDot />
                  </Text>
                )}
                <Text c="dimmed" fz={12} lh={1}>
                  {item}
                </Text>
              </Fragment>
            ))}
          </Group>
          <Text lineClamp={2} lh={1}>
            {manga.title}
          </Text>
        </Stack>
      </Stack>
    </Link>
  );
}

export default MangaCard;
