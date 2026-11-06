import { Box, Center } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';

type Props = { variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesMetaMarker({ variant, hasNew }: Props) {
  switch (variant) {
    case UPDATE_VARIANT.PROGRESS_DOT:
      return (
        <Box
          w={10}
          h={10}
          bdrs="50%"
          flex="none"
          bg={hasNew ? 'var(--mantine-primary-color-filled)' : undefined}
          role={hasNew ? 'img' : undefined}
          aria-label={hasNew ? 'Есть новые главы' : undefined}
          aria-hidden={hasNew ? undefined : true}
        />
      );
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.ACCENT_ICON:
      return (
        <Box
          display="inline-flex"
          w={12}
          h={12}
          flex="none"
          c={
            variant === UPDATE_VARIANT.ACCENT_ICON
              ? 'var(--mantine-primary-color-filled)'
              : 'dimmed'
          }
          style={{ visibility: hasNew ? 'visible' : 'hidden' }}
          role={hasNew ? 'img' : undefined}
          aria-label={hasNew ? 'Есть новые главы' : undefined}
          aria-hidden={hasNew ? undefined : true}
        >
          <SparkleIcon size={12} aria-hidden />
        </Box>
      );
    case UPDATE_VARIANT.ACCENT_STROKE:
      return (
        <Center
          w={8}
          h={12}
          flex="none"
          style={{ visibility: hasNew ? 'visible' : 'hidden' }}
          role={hasNew ? 'img' : undefined}
          aria-label={hasNew ? 'Есть новые главы' : undefined}
          aria-hidden={hasNew ? undefined : true}
        >
          <Box w={3} h={10} bdrs={2} bg="var(--mantine-primary-color-filled)" />
        </Center>
      );
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.STATUS_ROW:
    case UPDATE_VARIANT.LAST_LINE_DOT:
    case UPDATE_VARIANT.TOP_RIGHT_DOT:
    case UPDATE_VARIANT.CENTER_RIGHT_DOT:
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACTIONS_DOT:
    case UPDATE_VARIANT.TITLE_LINE:
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
    case UPDATE_VARIANT.ORANGE_META:
      return null;
  }
}

export default BookmarkUpdatesMetaMarker;
