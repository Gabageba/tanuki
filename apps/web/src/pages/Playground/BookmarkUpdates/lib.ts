import type { BoxProps, CardProps } from '@mantine/core';
import { UPDATE_VARIANT, type TitleTextBounds, type UpdateVariant } from './models';

export const getUpdatesCardProps = (
  variant: UpdateVariant,
  hasNew: boolean,
): Pick<CardProps, 'pl' | 'bg' | 'bd' | 'withBorder'> => {
  switch (variant) {
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
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
      return {};
    case UPDATE_VARIANT.CARD_STRIPE:
      return { pl: 8 };
    case UPDATE_VARIANT.CARD_TINT:
      return {
        withBorder: true,
        ...(hasNew && {
          bg: 'var(--mantine-primary-color-light)',
          bd: '1px solid var(--mantine-primary-color-light-color)',
        }),
      };
  }
};

export const getTitleDotPosition = (variant: UpdateVariant, bounds: TitleTextBounds): BoxProps => {
  // У всех трёх новых вариантов однострочное название выглядит точно как N0.
  if (!bounds.isMultiline) {
    return { left: bounds.firstLineEnd + 6, top: 'calc(0.65em - 4px)' };
  }

  switch (variant) {
    case UPDATE_VARIANT.LAST_LINE_DOT:
      return {
        left: bounds.lastLineEnd + 6,
        bottom: 'calc(0.65em - 4px)',
      };
    case UPDATE_VARIANT.TOP_RIGHT_DOT:
      return { right: 0, top: 'calc(0.65em - 4px)' };
    case UPDATE_VARIANT.CENTER_RIGHT_DOT:
      return { right: 0, top: '50%', style: { transform: 'translateY(-50%)' } };
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.STATUS_ROW:
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACTIONS_DOT:
    case UPDATE_VARIANT.ACCENT_ICON:
    case UPDATE_VARIANT.ACCENT_STROKE:
    case UPDATE_VARIANT.TITLE_LINE:
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
    case UPDATE_VARIANT.ORANGE_META:
      return {};
  }
};

export const getUpdatesProgressColor = (
  variant: UpdateVariant,
  hasNew: boolean,
): string | undefined => {
  if (!hasNew) return undefined;

  switch (variant) {
    case UPDATE_VARIANT.QUIET_PROGRESS:
      return 'var(--mantine-color-text)';
    case UPDATE_VARIANT.ORANGE_META:
      return 'var(--mantine-color-anchor)';
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.STATUS_ROW:
    case UPDATE_VARIANT.LAST_LINE_DOT:
    case UPDATE_VARIANT.TOP_RIGHT_DOT:
    case UPDATE_VARIANT.CENTER_RIGHT_DOT:
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACTIONS_DOT:
    case UPDATE_VARIANT.ACCENT_ICON:
    case UPDATE_VARIANT.ACCENT_STROKE:
    case UPDATE_VARIANT.TITLE_LINE:
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
      return undefined;
  }
};
