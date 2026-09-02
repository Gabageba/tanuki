import { Fragment } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { MANGA_TYPE, type Manga } from '@tanuki/contracts';
import MidDot from '@/shared/ui/MidDot';
import { getLabelByMangaType } from '../source/lib';
import MangaImage from './MangaImage';
import styles from './MangaCard.module.scss';

type Props = {
  manga: Manga;
};

function MangaCard({ manga }: Props) {
  const metaItems = [
    !!manga.type && getLabelByMangaType(manga.type),
    !!manga.year && String(manga.year),
    !!manga.chaptersCount && `${manga.chaptersCount} гл.`,
    !manga.chaptersCount && !!manga.pages && `${manga.pages} стр.`,
  ].filter((item): item is string => Boolean(item));

  return (
    <Link
      to={`/manga/${manga.sourceId}/${manga.id.slice(manga.sourceId.length + 1)}`}
      className={styles.card}
    >
      <Stack gap={8}>
        <MangaImage manga={manga} />
        <Stack gap={4}>
          {!!metaItems.length && (
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
          )}
          <Text lineClamp={2} lh={1}>
            {manga.title}
          </Text>
        </Stack>
      </Stack>
    </Link>
  );
}

export default MangaCard;
