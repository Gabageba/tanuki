import { Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import type { BookmarkItem } from '@tanuki/contracts';
import { getCatalogSourceTitle, getLabelByTitleType } from '@/entities/source/lib';
import SourceIcon from '@/entities/source/components/SourceIcon';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import { TITLE_CARD_LIST_SIZE, type TitleCardAction } from '@/entities/title/card/TitleCard/models';
import useRemoveTitleBookmark from '@/features/bookmark/hooks/useRemoveTitleBookmark';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import type { ViewMode } from '@/shared/lib/viewMode';
import BookmarkMetaLine from './BookmarkMetaLine';
import MoveBookmarkModal from './MoveBookmarkModal';

type Props = {
  bookmark: BookmarkItem;
  viewMode: ViewMode;
};

/** Карточка закладки (C10h) в виде, выбранном для каталога. Ведёт на источник свежей отметки
 *  чтения — его выбрал сервер. Раскладка та же, что у тайтла; в списке без описания и тегов:
 *  в закладках важнее, где остановился, чем о чём тайтл. */
function BookmarkCard({ bookmark, viewMode }: Props) {
  const { t } = useTranslation();
  const [isMoveOpened, moveModal] = useDisclosure(false);
  const removeBookmark = useRemoveTitleBookmark(bookmark.titleId);
  const typeLabel = getLabelByTitleType(bookmark.type, t);
  const sources =
    bookmark.otherSources.length > 0
      ? [{ sourceId: bookmark.sourceId, titleId: bookmark.titleId }, ...bookmark.otherSources]
      : [];
  const actions: TitleCardAction[] = [
    ...sources.map(({ sourceId, titleId }) => {
      const title = getCatalogSourceTitle(sourceId);
      return {
        id: titleId,
        children: title,
        leftSection: <SourceIcon id={sourceId} title={title} size={18} radius="sm" />,
        to: generatePath(ROUTE_PATHS.TITLE, { titleId }),
        group: t('openOnSource'),
      };
    }),
    {
      id: 'moveToFolder',
      children: t('moveToFolder'),
      leftSection: <FolderSimpleIcon />,
      onClick: moveModal.open,
    },
    {
      id: 'removeFromBookmarks',
      children: t('removeFromBookmarks'),
      leftSection: <TrashIcon />,
      color: 'red',
      onClick: () => removeBookmark.mutate(),
    },
  ];

  return (
    <>
      <TitleCard
        data={{
          ...bookmark,
          id: bookmark.titleId,
        }}
        viewMode={viewMode}
        listSize={TITLE_CARD_LIST_SIZE.COMPACT}
        meta={<BookmarkMetaLine bookmark={bookmark} />}
        actions={actions}
        footer={
          typeLabel && (
            <Text fz="xs" c="dimmed" lh="tight">
              {typeLabel}
            </Text>
          )
        }
      />
      <MoveBookmarkModal bookmark={bookmark} opened={isMoveOpened} onClose={moveModal.close} />
    </>
  );
}

export default BookmarkCard;
