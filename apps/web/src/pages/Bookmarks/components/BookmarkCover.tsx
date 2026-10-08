import { Box, Overlay, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, type BookmarkItem } from '@tanuki/contracts';
import CoverImage from '@/shared/ui/CoverImage';
import BlurredCover from '@/entities/title/BlurredCover';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import useIsAdultTitleHidden from '@/entities/title/hooks/useIsAdultTitleHidden';
import TitleAdultBadge from '@/entities/title/markers/TitleAdultBadge';
import { getBookmarkAvailabilityLabel, getCoverBlur, renderBookmarkAvailabilityIcon } from '../lib';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  bookmark: BookmarkItem;
  /** В списке обложка маленькая: подписи мельче, 18+ — в мета-строке. */
  compact?: boolean;
  w?: number;
};

/**
 * Обложка закладки: 18+ — бейдж и размытие, как в каталоге. Недоступная (U3a) — обесцвечена,
 * поверх лёгкое затемнение с иконкой и причиной.
 */
function BookmarkCover({ bookmark, compact = false, w }: Props) {
  const { t } = useTranslation();
  const isHidden = useIsAdultTitleHidden(bookmark);
  const isUnavailable = bookmark.availability !== BOOKMARK_AVAILABILITY.AVAILABLE;

  return (
    <Box pos="relative" className={titleStyles.imageWrapper} w={w} flex="none">
      <BlurredCover blur={getCoverBlur(isHidden, isUnavailable, compact)} grayscale={isUnavailable}>
        <CoverImage src={bookmark.coverUrl} alt={bookmark.name} className={titleStyles.image} />
      </BlurredCover>
      {/* У недоступной глаз заменяет иконка причины — размытие 18+ при этом остаётся. */}
      {isHidden && !isUnavailable && <HiddenCoverOverlay size={compact ? 24 : 40} />}
      {!compact && <TitleAdultBadge contentRating={bookmark.contentRating} />}
      {/* Затемнение всегда чёрное: оно лежит на картинке, тема тут не важна. `zIndex={0}` — как у
          глаза 18+, а бейджи (`zIndex: 1`) — над ним. Размыта сама картинка (`BlurredCover`), оверлей
          только затемняет. */}
      {isUnavailable && (
        <Overlay
          center
          color="#000"
          backgroundOpacity={0.35}
          zIndex={0}
          c="white"
          p={compact ? 4 : 'sm'}
        >
          <Stack gap={compact ? 2 : 6} align="center">
            {renderBookmarkAvailabilityIcon(bookmark.availability, compact ? 20 : 32)}
            <Text fz="xs" ta="center" lh="tight" c="white">
              {getBookmarkAvailabilityLabel(bookmark.availability, t)}
            </Text>
          </Stack>
        </Overlay>
      )}
    </Box>
  );
}

export default BookmarkCover;
