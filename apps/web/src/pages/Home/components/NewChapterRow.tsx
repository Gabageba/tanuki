import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { VIEW_MODE, type BookmarkItem } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle, getLabelByTitleType } from '@/entities/source/lib';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';

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
    <TitleCard
      data={{
        ...bookmark,
        id: bookmark.titleId,
        bookmarkFolder: folder,
      }}
      viewMode={VIEW_MODE.LIST}
      listSize={TITLE_CARD_LIST_SIZE.COMPACT}
      meta={
        <Group gap={6} wrap="nowrap" miw={0}>
          <SourceIcon id={bookmark.sourceId} title={sourceTitle} size={14} radius="sm" />
          <TitleMetaItems gap={4} items={[sourceTitle, getLabelByTitleType(bookmark.type, t)]} />
        </Group>
      }
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
