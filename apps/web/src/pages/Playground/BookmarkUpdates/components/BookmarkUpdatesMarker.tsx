import { Box, Text } from '@mantine/core';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';

type Props = { variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesMarker({ variant, hasNew }: Props) {
  if (!hasNew) return null;

  switch (variant) {
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
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
      return null;
    case UPDATE_VARIANT.COVER_DOT:
      return (
        <Box
          pos="absolute"
          top={6}
          right={6}
          w={18}
          h={18}
          bdrs="50%"
          bd="3px solid var(--mantine-color-white)"
          bg="var(--mantine-primary-color-filled)"
          role="img"
          aria-label="Есть новые главы"
        />
      );
    case UPDATE_VARIANT.COVER_LABEL:
      return (
        <Text
          pos="absolute"
          bottom={0}
          left={0}
          right={0}
          px={4}
          py={4}
          bg="var(--mantine-primary-color-filled)"
          c="var(--mantine-color-white)"
          fz="xs"
          fw={600}
          lh="tight"
          ta="center"
        >
          Новые главы
        </Text>
      );
  }
}

export default BookmarkUpdatesMarker;
