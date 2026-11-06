import { Box, Group } from '@mantine/core';
import TitleCardActions from '@/entities/title/card/TitleCard/components/TitleCardActions';
import type { TitleCardAction } from '@/entities/title/card/TitleCard/models';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';

type Props = { actions: TitleCardAction[]; variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesActions({ actions, variant, hasNew }: Props) {
  const menu = <TitleCardActions actions={actions} />;

  switch (variant) {
    case UPDATE_VARIANT.ACTIONS_DOT:
      return (
        <Group data-updates-actions gap={6} wrap="nowrap">
          <Box
            w={8}
            h={8}
            bdrs="50%"
            flex="none"
            bg={hasNew ? 'var(--mantine-primary-color-filled)' : undefined}
            role={hasNew ? 'img' : undefined}
            aria-label={hasNew ? 'Есть новые главы' : undefined}
            aria-hidden={hasNew ? undefined : true}
          />
          {menu}
        </Group>
      );
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
    case UPDATE_VARIANT.QUIET_PROGRESS:
    case UPDATE_VARIANT.QUIET_ICON:
    case UPDATE_VARIANT.QUIET_WORD:
    case UPDATE_VARIANT.ACCENT_ICON:
    case UPDATE_VARIANT.ACCENT_STROKE:
    case UPDATE_VARIANT.TITLE_LINE:
    case UPDATE_VARIANT.SHORT_TITLE_LINE:
    case UPDATE_VARIANT.ORANGE_META:
      return menu;
  }
}

export default BookmarkUpdatesActions;
