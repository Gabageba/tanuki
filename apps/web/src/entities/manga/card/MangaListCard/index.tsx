import { Badge, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CONTENT_RATING, type Manga } from '@tanuki/contracts';
import NavigateToMangaCard from '../../NavigateToMangaCard';
import MangaCardImage from '../MangaCardImage';
import MangaMetaItems from '../../MangaMetaItems';
import { getLabelByMangaType } from '@/entities/source/lib';
import MangaCardTags from '../MangaCardTags';
import MangaScoreMeta from '../../MangaScoreMeta';
import MangaState from '../../MangaState';
import styles from '../../Manga.module.scss';

type Props = {
  manga: Manga;
};

function MangaListCard({ manga }: Props) {
  const { t } = useTranslation();
  const metaItems = [
    !!manga.type && getLabelByMangaType(manga.type, t),
    !!manga.year && String(manga.year),
    !!manga.chaptersCount && t('countChaptersAbbrev', { count: manga.chaptersCount }),
    !manga.chaptersCount && !!manga.pages && t('countPagesAbbrev', { count: manga.pages }),
  ].filter((item): item is string => Boolean(item));

  return (
    <NavigateToMangaCard manga={manga} className={styles.card} data-view-mode="list" withBorder>
      <Group align="start" gap={0}>
        <MangaCardImage manga={manga} w={120} />
        <Stack p="sm" h="100%" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <Group gap={8}>
              {manga.contentRating === CONTENT_RATING.ADULT && <Badge color="red">18+</Badge>}
              <MangaMetaItems gap={6} items={metaItems} />
              {manga.releaseState && <MangaState state={manga.releaseState} />}
            </Group>
            <Text
              className={styles.title}
              lineClamp={manga.description ? 1 : 2}
              lh={1}
              fz={{ base: 16, xs: 18 }}
            >
              {manga.title}
            </Text>
            {!!manga.description && (
              <Text lh={1} lineClamp={4} c="dimmed">
                {manga.description}
              </Text>
            )}
          </Stack>
          <Group gap={8}>
            <MangaCardTags tags={manga.tags} />
            <MangaScoreMeta manga={manga} />
          </Group>
        </Stack>
      </Group>
    </NavigateToMangaCard>
  );
}

export default MangaListCard;
