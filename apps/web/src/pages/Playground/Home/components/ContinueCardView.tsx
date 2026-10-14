import { useContext } from 'react';
import { Box } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { CONTINUE_CARD, type ContinueCard, type ContinueItem } from '../models';
import ContinueCoverChapterCard from './ContinueCoverChapterCard';
import ContinueMetaFirstCard from './ContinueMetaFirstCard';
import ContinueNarrowCard from './ContinueNarrowCard';
import ContinueWideCard from './ContinueWideCard';

type Props = {
  card: ContinueCard;
  item: ContinueItem;
  /** C4 — крупной идёт только первая карточка. */
  isFirst: boolean;
  onRemove: () => void;
};

/** Карточка «Продолжить чтение» нужного варианта — в ширине, которую ей отводит лента. */
function ContinueCardView({ card, item, isFirst, onRemove }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const narrowWidth = isPhone ? 128 : 168;

  switch (card) {
    case CONTINUE_CARD.NARROW:
      return (
        <Box w={narrowWidth} flex="none">
          <ContinueNarrowCard item={item} onRemove={onRemove} />
        </Box>
      );
    case CONTINUE_CARD.WIDE:
      return (
        <Box w={isPhone ? 260 : 300} flex="none">
          <ContinueWideCard item={item} onRemove={onRemove} />
        </Box>
      );
    case CONTINUE_CARD.COVER_CHAPTER:
      return (
        <Box w={narrowWidth} flex="none">
          <ContinueCoverChapterCard item={item} onRemove={onRemove} />
        </Box>
      );
    case CONTINUE_CARD.META_FIRST:
      return (
        <Box w={narrowWidth} flex="none">
          <ContinueMetaFirstCard item={item} onRemove={onRemove} />
        </Box>
      );
    case CONTINUE_CARD.HERO:
      if (!isFirst) {
        return (
          <Box w={narrowWidth} flex="none">
            <ContinueNarrowCard item={item} onRemove={onRemove} />
          </Box>
        );
      }
      return (
        <Box w={isPhone ? 300 : 400} flex="none">
          <ContinueWideCard item={item} coverWidth={isPhone ? 104 : 136} onRemove={onRemove} />
        </Box>
      );
  }
}

export default ContinueCardView;
