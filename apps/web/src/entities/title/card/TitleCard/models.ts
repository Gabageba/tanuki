import type { ReactNode } from 'react';
import type { MenuItemProps } from '@mantine/core';
import type { To } from 'react-router';
import type { BookmarkAvailability, EnumLiteralsOf, Title, ViewMode } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

export const TITLE_CARD_LIST_SIZE = {
  REGULAR: 'regular',
  COMPACT: 'compact',
} as const;
export type TitleCardListSize = EnumLiteralsOf<typeof TITLE_CARD_LIST_SIZE>;

/** Данные отображения карточки. DTO источника, закладки и истории чтения остаются своими. */
export type TitleCardData = Pick<Title, 'id' | 'name' | 'sourceId' | 'contentRating'> &
  Partial<Pick<Title, 'description' | 'rating' | 'likes'>> & {
    coverUrl: string | null;
    bookmarkFolder?: ResolvedBookmarkFolder | null;
    /** Наличие поля резервирует место под точку, даже когда новых глав нет. */
    hasNewChapters?: boolean;
    availability?: BookmarkAvailability;
  };

export type TitleCardLayout = {
  viewMode: ViewMode;
  listSize: TitleCardListSize;
};

export type TitleCardLayoutOptions = Partial<TitleCardLayout>;

export type TitleCardSlots = {
  meta?: ReactNode;
  footer?: ReactNode;
};

export type TitleCardViewSlots = TitleCardSlots & {
  actions?: ReactNode;
};

export type TitleCardAction = MenuItemProps & { id: string; group?: string } & (
    { onClick: () => void; to?: never } | { to: To; onClick?: never }
  );

export type TitleCardContent = TitleCardSlots & {
  data: TitleCardData;
  showSource?: boolean;
  actions?: TitleCardAction[];
};

export type TitleCardViewContent = Omit<TitleCardContent, 'actions'> &
  Pick<TitleCardViewSlots, 'actions'>;

export type TitleCardSkeletonContent = TitleCardViewSlots & {
  withDescription?: boolean;
};

export type TitleCardSkeletonOptions = TitleCardLayoutOptions &
  Omit<TitleCardSkeletonContent, 'actions'> & {
    withActions?: boolean;
  };

export const TITLE_CARD_COVER_WIDTH = 120;
export const TITLE_CARD_COMPACT_COVER_WIDTH = 84;
export const TITLE_CARD_HIDDEN_BLUR = 20;
export const TITLE_CARD_NEW_DOT_SPACE = 14;
export const TITLE_CARD_ACTION_SIZE = 24;
export const TITLE_CARD_ACTION_ICON_SIZE = 18;
