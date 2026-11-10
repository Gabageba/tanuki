import { Group } from '@mantine/core';
import type { BookmarkItem } from '@tanuki/contracts';
import { CARD_VARIANT, type UpdateVariant } from '../models';
import NewChapterCombinedMeta from './NewChapterCombinedMeta';
import NewChapterCounter from './NewChapterCounter';
import NewChapterUpdateMeta from './NewChapterUpdateMeta';

type Props = { bookmark: BookmarkItem; variant: UpdateVariant };

function NewChapterFooter({ bookmark, variant }: Props) {
  switch (variant) {
    case CARD_VARIANT.COMBINED_META:
    case CARD_VARIANT.COLORED_COUNT:
    case CARD_VARIANT.BOLD_COLORED_COUNT:
      return (
        <Group gap={0} fz="sm" lh="tight" mih="1lh">
          <NewChapterCombinedMeta bookmark={bookmark} variant={variant} />
        </Group>
      );
    case CARD_VARIANT.SOFT_ACCENT:
    case CARD_VARIANT.DIMMED:
    case CARD_VARIANT.BADGE:
    case CARD_VARIANT.ICON_BADGE:
    case CARD_VARIANT.NUMBER_BADGE:
      return (
        <Group gap={8} wrap="nowrap">
          <NewChapterCounter count={bookmark.newChaptersCount} variant={variant} />
          <NewChapterUpdateMeta bookmark={bookmark} />
        </Group>
      );
  }
}

export default NewChapterFooter;
