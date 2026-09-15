import { Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MANGA_TYPE, type Manga } from '@tanuki/contracts';
import NavigateToMangaCard from '../../NavigateToMangaCard';
import MangaMetaItems from '../../MangaMetaItems';
import { getLabelByMangaType } from '@/entities/source/lib';
import MangaCardImage from '../../MangaCardImage';
import styles from '../../Manga.module.scss';

type Props = {
  manga: Manga;
  showSource?: boolean;
};

function MangaGridCard({ manga, showSource = false }: Props) {
  const { t } = useTranslation();
  const metaItems = [
    getLabelByMangaType(manga.type, t),
    !!manga.year && String(manga.year),
    !!manga.chaptersCount && t('countChaptersAbbrev', { count: manga.chaptersCount }),
    !manga.chaptersCount && !!manga.pages && t('countPagesAbbrev', { count: manga.pages }),
  ].filter((item): item is string => Boolean(item));

  const metaGap = useMemo(
    () => (manga.type === MANGA_TYPE.MANHUA && (manga.chaptersCount || 0) >= 1000 ? 2 : 4),
    [manga.type, manga.chaptersCount],
  );

  return (
    <NavigateToMangaCard manga={manga} data-view-mode="grid" className={styles.card}>
      <Stack gap={8}>
        <MangaCardImage manga={manga} showBadges showSource={showSource} />
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
