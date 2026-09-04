import { Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { MANGA_TYPE, type Manga } from '@tanuki/contracts';
import NavigateToMangaCard from '../../NavigateToMangaCard';
import MangaMetaItems from '../../MangaMetaItems';
import { getLabelByMangaType } from '@/entities/source/lib';
import MangaCardImage from '../MangaCardImage';
import styles from '../../Manga.module.scss';

type Props = {
  manga: Manga;
};

function MangaGridCard({ manga }: Props) {
  const metaItems = [
    !!manga.type && getLabelByMangaType(manga.type),
    !!manga.year && String(manga.year),
    !!manga.chaptersCount && `${manga.chaptersCount} гл.`,
    !manga.chaptersCount && !!manga.pages && `${manga.pages} стр.`,
  ].filter((item): item is string => Boolean(item));

  const metaGap = useMemo(
    () => (manga.type === MANGA_TYPE.MANHUA && (manga.chaptersCount || 0) >= 1000 ? 2 : 4),
    [manga.type, manga.chaptersCount],
  );

  return (
    <NavigateToMangaCard manga={manga} data-view-mode="grid" className={styles.card}>
      <Stack gap={8}>
        <MangaCardImage manga={manga} showBadges />
        <Stack gap={4}>
          <MangaMetaItems items={metaItems} gap={metaGap} />
          <Text className={styles.title} lineClamp={2} lh={1}>
            {manga.title}
          </Text>
        </Stack>
      </Stack>
    </NavigateToMangaCard>
  );
}

export default MangaGridCard;
