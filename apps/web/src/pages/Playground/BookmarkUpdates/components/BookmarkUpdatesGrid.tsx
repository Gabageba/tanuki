import { Card, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardMeta from '@/entities/title/card/TitleCard/components/TitleCardMeta';
import TitleCardMetaRow from '@/entities/title/card/TitleCard/components/TitleCardMetaRow';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import type { TitleCardViewContent } from '@/entities/title/card/TitleCard/models';
import { UPDATE_VARIANT, type UpdateVariant } from '../models';
import { getUpdatesCardProps } from '../lib';
import BookmarkUpdatesAccent from './BookmarkUpdatesAccent';
import BookmarkUpdatesCover from './BookmarkUpdatesCover';
import BookmarkUpdatesStatus from './BookmarkUpdatesStatus';
import BookmarkUpdatesName from './BookmarkUpdatesName';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';
import updateStyles from '../BookmarkUpdates.module.scss';

type Props = TitleCardViewContent & { variant: UpdateVariant; hasNew: boolean };

/** Локальные варианты отметки; общая анатомия остаётся как у TitleCardGrid. */
function BookmarkUpdatesGrid({ data, meta, actions, variant, hasNew }: Props) {
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.GRID}
      data-has-new={hasNew}
      className={`${styles.card} ${variant === UPDATE_VARIANT.CARD_TINT ? updateStyles.tintedCard : ''}`}
      pos="relative"
      p={0}
      c="inherit"
      bg="transparent"
      bdrs={
        variant === UPDATE_VARIANT.CARD_TINT
          ? 'md'
          : 'var(--mantine-radius-md) var(--mantine-radius-md) 0 0'
      }
      {...getUpdatesCardProps(variant, hasNew)}
    >
      <Link to={getTitleCardPath(data.id)} aria-label={data.name} className={styles.link} />
      <BookmarkUpdatesAccent variant={variant} hasNew={hasNew} />
      <Stack gap={8}>
        <BookmarkUpdatesCover data={data} variant={variant} hasNew={hasNew} />
        <Stack
          className={styles.heading}
          gap={4}
          px={variant === UPDATE_VARIANT.CARD_TINT ? 8 : undefined}
          pb={variant === UPDATE_VARIANT.CARD_TINT ? 8 : undefined}
        >
          <BookmarkUpdatesStatus variant={variant} hasNew={hasNew} />
          <TitleCardMetaRow
            meta={<TitleCardMeta contentRating={data.contentRating}>{meta}</TitleCardMeta>}
            actions={actions}
          />
          <BookmarkUpdatesName data={data} variant={variant} hasNew={hasNew} />
        </Stack>
      </Stack>
    </Card>
  );
}

export default BookmarkUpdatesGrid;
