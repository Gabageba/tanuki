import { Box } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { VIEW_MODE, type BookmarkItem } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { getCatalogSourceTitle, getLabelByTitleType } from '@/entities/source/lib';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import useDateFormat from '@/shared/hooks/useDateFormat';

type Props = {
  bookmark: BookmarkItem;
  /** Папка закладки — метка перед источником; null — папки ещё не загрузились. */
  folder: ResolvedBookmarkFolder | null;
};

/** A9 + M2: папка, источник текстом и тип над названием; внизу «Гл. 131 (+2) · дата»,
 *  где цветом выделено только количество новых глав. Ведёт на тайтл. */
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
      meta={<TitleMetaItems gap={4} items={[sourceTitle, getLabelByTitleType(bookmark.type, t)]} />}
      footer={
        <TitleMetaItems
          gap={4}
          items={[
            <Box
              key="chapter"
              component="span"
              ff="monospace"
              lh="tight"
              style={{ whiteSpace: 'nowrap' }}
            >
              {bookmark.latestChapterNumber !== null ? (
                <Trans
                  t={t}
                  i18nKey="chapterNumberWithNewChaptersAbbrev"
                  values={{
                    number: bookmark.latestChapterNumber,
                    count: bookmark.newChaptersCount,
                  }}
                  components={{
                    newChapters: <Box component="span" c="var(--mantine-color-anchor)" />,
                  }}
                />
              ) : (
                <Box component="span" c="var(--mantine-color-anchor)">
                  {t('plusCountChaptersAbbrev', { count: bookmark.newChaptersCount })}
                </Box>
              )}
            </Box>,
            bookmark.latestNewAt && formatRelative(bookmark.latestNewAt),
          ]}
        />
      }
    />
  );
}

export default NewChapterRow;
