import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BookmarkItem } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle, getLabelByTitleType } from '@/entities/source/lib';
import TitleCardName from '@/entities/title/card/TitleCardName';
import TitleListCard from '@/entities/title/card/TitleListCard';
import TitleBookmarkMarker from '@/entities/title/markers/TitleBookmarkMarker';
import TitleCover from '@/entities/title/TitleCover';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { NEW_CHAPTER_COVER_WIDTH } from '../models';

type Props = {
  bookmark: BookmarkItem;
  /** Папка закладки — метка на обложке; null — папки ещё не загрузились. */
  folder: ResolvedBookmarkFolder | null;
};

/** Строка «Новых глав» — карточка списка, как в каталоге: обложка с меткой папки, источник и тип,
 *  название, а внизу «+3 гл.» акцентом, номер последней главы и когда она вышла. Ведёт на тайтл. */
function NewChapterRow({ bookmark, folder }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();
  const sourceTitle = getCatalogSourceTitle(bookmark.sourceId);

  return (
    <TitleListCard
      titleId={bookmark.titleId}
      contentRating={bookmark.contentRating}
      cover={
        <TitleCover cover={bookmark} hiddenIconSize={24} w={NEW_CHAPTER_COVER_WIDTH} flex="none">
          {folder && <TitleBookmarkMarker folder={folder} compact />}
        </TitleCover>
      }
      meta={
        <Group gap={6} wrap="nowrap" miw={0}>
          <SourceIcon id={bookmark.sourceId} title={sourceTitle} size={14} />
          <TitleMetaItems gap={4} items={[sourceTitle, getLabelByTitleType(bookmark.type, t)]} />
        </Group>
      }
      name={<TitleCardName name={bookmark.name} fz="sm" />}
      footer={
        <Group gap={8} wrap="nowrap">
          <Text fz="sm" fw={600} ff="monospace" c="var(--mantine-primary-color-filled)" lh="tight">
            {t('plusCountChaptersAbbrev', { count: bookmark.newChaptersCount })}
          </Text>
          <TitleMetaItems
            gap={4}
            items={[
              bookmark.latestChapterNumber !== null && (
                <Box key="chapter" component="span" ff="monospace" lh="tight">
                  {t('chapterNumberAbbrev', { number: bookmark.latestChapterNumber })}
                </Box>
              ),
              bookmark.latestNewAt && formatRelative(bookmark.latestNewAt),
            ]}
          />
        </Group>
      }
    />
  );
}

export default NewChapterRow;
