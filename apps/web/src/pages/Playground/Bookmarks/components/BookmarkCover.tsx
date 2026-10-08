import { Badge, Box, Group, Overlay, Progress, Stack, Text } from '@mantine/core';
import CoverImage from '@/shared/ui/CoverImage';
import Mdash from '@/shared/ui/Mdash';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import TitleAdultBadge from '@/entities/title/markers/TitleAdultBadge';
import { CONTENT_RATING } from '@tanuki/contracts';
import {
  getAvailabilityLabel,
  getCoverFilter,
  getMockCoverUrl,
  getPlateOpacity,
  renderAvailabilityIcon,
} from '../lib';
import {
  AVAILABILITY,
  CARD_VARIANT,
  COVER_FILTER,
  type CardVariant,
  SOURCES_VARIANT,
  type MockBookmark,
  type SourcesVariant,
  type UnavailableVariant,
} from '../models';
import CoverSourcesButton from './CoverSourcesButton';
import NewChaptersBar from './NewChaptersBar';
import NewCountBadge from './NewCountBadge';
import titleStyles from '@/entities/title/Title.module.scss';
import styles from '../Bookmarks.module.scss';

type Props = {
  bookmark: MockBookmark;
  variant: CardVariant;
  unavailableVariant: UnavailableVariant;
  sourcesVariant?: SourcesVariant;
  /** В списке обложка маленькая: бейджи мельче. */
  compact?: boolean;
  w?: number;
};

/** Обложка закладки со всем, что вариант кладёт поверх или рядом: счётчик (C1), прогресс (C4),
 *  полоса под обложкой (C6), NEW (C7), рамка (C9), приглушение (U1) или плашка причины (U2). 18+ — бейдж и размытие, как в каталоге. */
function BookmarkCover({
  bookmark,
  variant,
  unavailableVariant,
  sourcesVariant,
  compact = false,
  w,
}: Props) {
  const isUnavailable = bookmark.availability !== AVAILABILITY.AVAILABLE;
  const plateOpacity = isUnavailable ? getPlateOpacity(unavailableVariant) : null;
  const hasPlate = plateOpacity !== null;
  const coverFilter = isUnavailable ? getCoverFilter(unavailableVariant) : null;
  const getCoverClassName = () => {
    if (coverFilter === COVER_FILTER.DIMMED) return styles.dimmedCover;
    if (coverFilter === COVER_FILTER.GRAY) return styles.grayCover;
    return undefined;
  };
  const offset = compact ? 4 : 6;

  const hasNew = !isUnavailable && bookmark.newChaptersCount > 0;
  const hasFrame = hasNew && variant === CARD_VARIANT.FRAME;

  const cover = (
    <Box
      pos="relative"
      className={`${titleStyles.imageWrapper}${hasFrame ? ` ${styles.newFrame}` : ''}`}
      w={variant === CARD_VARIANT.BOTTOM_BAR ? undefined : w}
      flex="none"
    >
      <Box h="100%" className={getCoverClassName()}>
        <CoverImage
          src={getMockCoverUrl(bookmark.coverSeed)}
          alt={bookmark.name}
          className={titleStyles.image}
        />
      </Box>
      {bookmark.isAdult && <HiddenCoverOverlay size={compact ? 24 : 40} />}
      {/* В списке 18+ стоит в мета-строке, как у TitleListCard. */}
      {!compact && (
        <TitleAdultBadge
          contentRating={bookmark.isAdult ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE}
        />
      )}
      {/* Затемнение всегда чёрное: оно лежит на картинке, тема тут не важна. */}
      {hasPlate && (
        <Overlay
          center
          blur={6}
          color="#000"
          backgroundOpacity={plateOpacity ?? undefined}
          zIndex={1}
          c="white"
          p={compact ? 4 : 'sm'}
        >
          <Stack gap={compact ? 2 : 6} align="center">
            {renderAvailabilityIcon(bookmark.availability, { size: compact ? 20 : 32 })}
            <Text fz="xs" ta="center" lh="tight" c="white">
              {getAvailabilityLabel(bookmark.availability)}
            </Text>
          </Stack>
        </Overlay>
      )}
      {!isUnavailable && variant === CARD_VARIANT.COVER_BADGE && (
        <Box pos="absolute" bottom={offset} left={offset} className={styles.overCover}>
          <NewCountBadge count={bookmark.newChaptersCount} onCover size={compact ? 'sm' : 'lg'} />
        </Box>
      )}
      {!isUnavailable && variant === CARD_VARIANT.COVER_PROGRESS && (
        <Stack
          pos="absolute"
          bottom={0}
          left={0}
          right={0}
          gap={compact ? 4 : 6}
          p={compact ? 4 : 8}
          pt={compact ? 16 : 32}
          className={styles.progressShade}
        >
          <Group justify="space-between" gap={4} wrap="nowrap">
            <Text component="div" c="white" fz="xs" ff="monospace" lh="tight">
              {bookmark.progress
                ? `${bookmark.progress.chapter} / ${bookmark.progress.total}`
                : (bookmark.chaptersCount ?? <Mdash />)}
            </Text>
            <NewCountBadge count={bookmark.newChaptersCount} onCover size={compact ? 'xs' : 'sm'} />
          </Group>
          {bookmark.progress && (
            <Progress
              size={compact ? 2 : 3}
              value={(bookmark.progress.chapter / bookmark.progress.total) * 100}
              bg="rgb(255 255 255 / 25%)"
            />
          )}
        </Stack>
      )}
      {hasNew && variant === CARD_VARIANT.COVER_DOT && (
        <Box
          pos="absolute"
          bottom={offset + 2}
          left={offset + 2}
          w={compact ? 8 : 12}
          h={compact ? 8 : 12}
          bdrs="50%"
          bg="var(--mantine-primary-color-filled)"
          className={`${styles.overCover} ${styles.cutoutDot}`}
          aria-label="Есть новые главы"
        />
      )}
      {hasNew && variant === CARD_VARIANT.CORNER && (
        <Box
          pos="absolute"
          top={0}
          left={0}
          className={`${styles.overCover} ${styles.cornerFold}`}
          mod={{ compact }}
          aria-label="Есть новые главы"
        />
      )}
      {!isUnavailable && sourcesVariant === SOURCES_VARIANT.COVER && (
        <CoverSourcesButton sourceIds={bookmark.sourceIds} compact={compact} />
      )}
      {hasNew && variant === CARD_VARIANT.NEW_TAG && (
        <Box pos="absolute" bottom={offset} left={offset} className={styles.overCover}>
          <Badge variant="filled" size={compact ? 'xs' : 'sm'} ff="monospace" radius="sm">
            NEW
          </Badge>
        </Box>
      )}
    </Box>
  );

  if (variant !== CARD_VARIANT.BOTTOM_BAR) return cover;

  return (
    <Stack gap={4} w={w} flex="none">
      {cover}
      {!isUnavailable && <NewChaptersBar bookmark={bookmark} />}
    </Stack>
  );
}

export default BookmarkCover;
