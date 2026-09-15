import { Flex, Group, SimpleGrid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Manga } from '@tanuki/contracts';
import MangaRating from './MangaRating';
import MangaMetaItem from './MangaMetaItem';
import { getLabelByMangaType } from '@/entities/source/lib';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import MangaState from '@/entities/manga/MangaState';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  manga: Manga;
  branchesCount: number;
};

function MangaMeta({ manga, branchesCount }: Props) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <Flex
      align="flex-start"
      gap={{ base: 'md', xs: 'lg' }}
      direction={{ base: 'column', xs: 'row' }}
    >
      <MangaRating rating={manga.rating} />
      <SimpleGrid cols={{ base: 2, sm: 3 }} flex={1} w="100%">
        <MangaMetaItem
          value={[getLabelByMangaType(manga.type, t), manga.year].filter(
            (item): item is string | number => Boolean(item),
          )}
          label={t('typeAndYear')}
        />
        <MangaMetaItem
          value={<MangaState state={manga.releaseState} fz={14} />}
          label={t('original')}
        />

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
          ]}
          label={t('translation')}
        />
        <MangaMetaItem
          value={t('countChapters', { count: manga.chaptersCount })}
          label={t('volume')}
        />
        <MangaMetaItem value={formatDate(manga.lastUpdatedAt)} label={t('lastChapter')} />
      </SimpleGrid>
    </Flex>
  );
}

export default MangaMeta;
