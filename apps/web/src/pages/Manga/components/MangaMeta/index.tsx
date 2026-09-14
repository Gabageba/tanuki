import { DataList, Group, SimpleGrid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Manga } from '@tanuki/contracts';
import MangaRating from './MangaRating';
import MangaMetaItem from './MangaMetaItem';
import { getLabelByMangaType } from '@/entities/source/lib';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import MangaState from '@/entities/manga/MangaState';
import { formatDate } from '@/shared/lib/formatDate';

type Props = {
  manga: Manga;
  branchesCount: number;
};

function MangaMeta({ manga, branchesCount }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <Group align="flex-start" gap="lg">
      <MangaRating rating={manga.rating} />
      <SimpleGrid cols={3} flex={1}>
        <DataList orientation="vertical">
          <MangaMetaItem
            value={[!!manga.type && getLabelByMangaType(manga.type, t), manga.year].filter(
              (item): item is string | number => Boolean(item),
            )}
            label={t('typeAndYear')}
          />
          <MangaMetaItem
            value={manga.releaseState ? <MangaState state={manga.releaseState} fz={14} /> : null}
            label={t('original')}
          />
        </DataList>
        <DataList orientation="vertical">
          <MangaMetaItem
            value={
              manga.authors ? (
                <Group gap={4}>
                  {manga.authors[0]}
                  <OtherItemsTag count={manga.authors.slice(1).length} />
                </Group>
              ) : null
            }
            label={t('author')}
          />
          <MangaMetaItem
            value={[
              manga.translationState && (
                <MangaState key="manga-state" state={manga.translationState} fz={14} />
              ),
              t('countBranches', { count: branchesCount }),
            ].filter(Boolean)}
            label={t('translation')}
          />
        </DataList>
        <DataList orientation="vertical">
          <MangaMetaItem
            value={t('countChapters', { count: manga.chaptersCount })}
            label={t('volume')}
          />
          <MangaMetaItem
            value={manga.lastUpdatedAt ? formatDate(manga.lastUpdatedAt, i18n.language) : null}
            label={t('lastChapter')}
          />
        </DataList>
      </SimpleGrid>
    </Group>
  );
}

export default MangaMeta;
