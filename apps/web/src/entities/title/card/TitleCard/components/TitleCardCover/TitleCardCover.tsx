import { Box } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import CoverImage from '@/shared/ui/CoverImage';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import useIsAdultTitleHidden from '@/entities/title/hooks/useIsAdultTitleHidden';
import TitleCardDecorations from './TitleCardDecorations';
import TitleCardUnavailableOverlay from './TitleCardUnavailableOverlay';
import useTitleCardLayout from '../../hooks/useTitleCardLayout';
import { getTitleCardCoverWidth, isTitleCardUnavailable } from '../../lib';
import { TITLE_CARD_HIDDEN_BLUR, TITLE_CARD_LIST_SIZE, type TitleCardData } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = { data: TitleCardData; showSource?: boolean };

function TitleCardCover({ data, showSource }: Props) {
  const { viewMode, listSize } = useTitleCardLayout();
  const isHidden = useIsAdultTitleHidden(data);
  const isUnavailable = isTitleCardUnavailable(data);
  const isGrid = viewMode === VIEW_MODE.GRID;
  const blur = isHidden ? TITLE_CARD_HIDDEN_BLUR : isUnavailable ? (isGrid ? 6 : 3) : 0;
  const filters = [isUnavailable && 'grayscale(1)', blur > 0 && `blur(${blur}px)`].filter(Boolean);
  const width = getTitleCardCoverWidth(listSize);

  return (
    <Box
      data-card-cover
      className={styles.cover}
      pos="relative"
      w={isGrid ? '100%' : width}
      mih={isGrid ? undefined : (width * 4) / 3}
      flex="none"
      bdrs="md"
      style={{ aspectRatio: isGrid ? '3 / 4' : undefined, overflow: 'hidden' }}
    >
      {/* Запас прячет мягкий край размытия за рамкой обложки. */}
      <Box
        pos="absolute"
        inset={-2 * blur}
        style={filters.length > 0 ? { filter: filters.join(' ') } : undefined}
      >
        <CoverImage src={data.coverUrl} alt={data.name} className={styles.image} />
      </Box>
      <TitleCardUnavailableOverlay availability={data.availability} />
      {isHidden && !isUnavailable && (
        <HiddenCoverOverlay size={isGrid || listSize === TITLE_CARD_LIST_SIZE.REGULAR ? 40 : 24} />
      )}
      <TitleCardDecorations data={data} showSource={showSource} />
    </Box>
  );
}

export default TitleCardCover;
