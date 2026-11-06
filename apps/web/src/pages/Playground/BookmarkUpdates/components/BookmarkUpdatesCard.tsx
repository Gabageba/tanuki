import { Text } from '@mantine/core';
import { FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { generatePath } from 'react-router';
import type { ViewMode } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import TitleCardLayout from '@/entities/title/card/TitleCard/components/TitleCardLayout';
import { isTitleCardUnavailable } from '@/entities/title/card/TitleCard/lib';
import { TITLE_CARD_LIST_SIZE, type TitleCardAction } from '@/entities/title/card/TitleCard/models';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { UPDATE_VARIANT, type BookmarkExample, type UpdateVariant } from '../models';
import BookmarkUpdatesGrid from './BookmarkUpdatesGrid';
import BookmarkUpdatesList from './BookmarkUpdatesList';
import BookmarkUpdatesMeta from './BookmarkUpdatesMeta';
import BookmarkUpdatesActions from './BookmarkUpdatesActions';

type Props = { example: BookmarkExample; variant: UpdateVariant; viewMode: ViewMode };

function BookmarkUpdatesCard({ example, variant, viewMode }: Props) {
  const { bookmark, typeLabel } = example;
  const data = { ...bookmark, id: bookmark.titleId };
  const hasNew = bookmark.newChaptersCount > 0 && !isTitleCardUnavailable(data);
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
        group: 'Открыть на источнике',
      };
    }),
    {
      id: 'moveToFolder',
      children: 'Перенести в папку',
      leftSection: <FolderSimpleIcon />,
      to: '#',
    },
    {
      id: 'removeFromBookmarks',
      children: 'Убрать из закладок',
      leftSection: <TrashIcon />,
      color: 'red',
      to: '#',
    },
  ];
  const content = {
    data,
    meta: <BookmarkUpdatesMeta bookmark={bookmark} variant={variant} hasNew={hasNew} />,
    footer: (
      <Text fz="xs" c="dimmed" lh="tight">
        {typeLabel}
      </Text>
    ),
  };

  const variantContent = {
    ...content,
    actions: <BookmarkUpdatesActions actions={actions} variant={variant} hasNew={hasNew} />,
    variant,
    hasNew,
  };

  switch (variant) {
    case UPDATE_VARIANT.CURRENT:
      return (
        <TitleCard
          {...content}
          data={{ ...data, hasNewChapters: hasNew }}
          viewMode={viewMode}
          listSize={TITLE_CARD_LIST_SIZE.COMPACT}
          actions={actions}
        />
      );
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.STATUS_ROW:
    case UPDATE_VARIANT.LAST_LINE_DOT:
    case UPDATE_VARIANT.TOP_RIGHT_DOT:
    case UPDATE_VARIANT.CENTER_RIGHT_DOT:
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACTIONS_DOT:
    case UPDATE_VARIANT.ACCENT_ICON:
    case UPDATE_VARIANT.ACCENT_STROKE:
    case UPDATE_VARIANT.TITLE_LINE:
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
    case UPDATE_VARIANT.ORANGE_META:
      return (
        <TitleCardLayout
          viewMode={viewMode}
          listSize={TITLE_CARD_LIST_SIZE.COMPACT}
          grid={<BookmarkUpdatesGrid {...variantContent} />}
          list={<BookmarkUpdatesList {...variantContent} />}
        />
      );
  }
}

export default BookmarkUpdatesCard;
