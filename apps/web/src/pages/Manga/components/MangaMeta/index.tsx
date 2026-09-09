import { Group, SimpleGrid } from '@mantine/core';
import type { Manga } from '@tanuki/contracts';
import MangaRating from './MangaRating';
import MangaMetaItem from './MangaMetaItem';
import { getLabelByMangaType } from '@/entities/source/lib';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import MangaState from '@/entities/manga/MangaState';
import { formatRuDate } from '@/shared/lib/formatDate';

type Props = {
  manga: Manga;
  branchesCount: number;
};

function MangaMeta({ manga, branchesCount }: Props) {
  return (
    <Group align="flex-start" gap="xl">
      <MangaRating rating={manga.rating} />
      <SimpleGrid cols={3} flex={1}>
        <MangaMetaItem
          value={[!!manga.type && getLabelByMangaType(manga.type), manga.year].filter(
            (item): item is string | number => Boolean(item),
          )}
          title="Тип и год"
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
          title="Автор"
        />
        <MangaMetaItem value={`${manga.chaptersCount} глав`} title="Объем" />
        <MangaMetaItem
          value={manga.releaseState ? <MangaState state={manga.releaseState} fz={16} /> : null}
          title="Оригинал"
        />
        <MangaMetaItem
          value={[
            manga.translationState && (
              <MangaState key="manga-state" state={manga.translationState} fz={16} />
            ),
            `${branchesCount} ветки`,
          ].filter(Boolean)}
          title="Перевод"
        />
        <MangaMetaItem
          value={manga.lastUpdatedAt ? formatRuDate(manga.lastUpdatedAt) : null}
          title="Последняя глава"
        />
      </SimpleGrid>
    </Group>
  );
}

export default MangaMeta;
