import { Group, Text } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';

type Props = { variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesStatus({ variant, hasNew }: Props) {
  switch (variant) {
    case UPDATE_VARIANT.CURRENT:
    case UPDATE_VARIANT.PROGRESS_DOT:
    case UPDATE_VARIANT.COVER_DOT:
    case UPDATE_VARIANT.COVER_LABEL:
    case UPDATE_VARIANT.CARD_STRIPE:
    case UPDATE_VARIANT.CARD_TINT:
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
    case UPDATE_VARIANT.STATUS_ROW:
      return (
        <Group
          data-updates-status
          gap={4}
          wrap="nowrap"
          mih={16}
          c="var(--mantine-color-anchor)"
          style={{ visibility: hasNew ? 'visible' : 'hidden' }}
          role={hasNew ? 'img' : undefined}
          aria-label={hasNew ? 'Есть новые главы' : undefined}
          aria-hidden={hasNew ? undefined : true}
        >
          <SparkleIcon size={14} aria-hidden />
          <Text c="inherit" fz="xs" lh="tight" fw={600}>
            Новые главы
          </Text>
        </Group>
      );
  }
}

export default BookmarkUpdatesStatus;
