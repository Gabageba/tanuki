import { Box, VisuallyHidden } from '@mantine/core';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';
import styles from '../BookmarkUpdates.module.scss';

type Props = { variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesAccent({ variant, hasNew }: Props) {
  if (!hasNew) return null;

  switch (variant) {
    case UPDATE_VARIANT.CARD_STRIPE:
      return (
        <Box
          className={styles.stripe}
          pos="absolute"
          top={0}
          bottom={0}
          left={0}
          w={3}
          bg="var(--mantine-primary-color-filled)"
          role="img"
          aria-label="Есть новые главы"
        />
      );
    case UPDATE_VARIANT.CARD_TINT:
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.ORANGE_META:
      return <VisuallyHidden role="img" aria-label="Есть новые главы" />;
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
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
      return null;
  }
}

export default BookmarkUpdatesAccent;
