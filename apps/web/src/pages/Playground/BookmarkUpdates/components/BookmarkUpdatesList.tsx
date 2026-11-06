import { Box, Card, Group, Stack } from '@mantine/core';
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

/** Локальные варианты компактной BookmarkCard с теми же данными и действиями. */
function BookmarkUpdatesList({ data, meta, actions, footer, variant, hasNew }: Props) {
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.LIST}
      data-has-new={hasNew}
      className={`${styles.card} ${variant === UPDATE_VARIANT.CARD_TINT ? updateStyles.tintedCard : ''}`}
      pos="relative"
      p={0}
      c="inherit"
      withBorder
      {...getUpdatesCardProps(variant, hasNew)}
    >
      <Link to={getTitleCardPath(data.id)} aria-label={data.name} className={styles.link} />
      <BookmarkUpdatesAccent variant={variant} hasNew={hasNew} />
      <Group align="stretch" wrap="nowrap" gap={0}>
        <BookmarkUpdatesCover data={data} variant={variant} hasNew={hasNew} />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack className={styles.heading} gap={8} flex={1}>
            <BookmarkUpdatesStatus variant={variant} hasNew={hasNew} />
            <TitleCardMetaRow
              meta={<TitleCardMeta contentRating={data.contentRating}>{meta}</TitleCardMeta>}
              actions={actions}
            />
            <BookmarkUpdatesName data={data} variant={variant} hasNew={hasNew} />
          </Stack>
          <Box data-card-footer className={styles.footer}>
            {footer}
          </Box>
        </Stack>
      </Group>
    </Card>
  );
}

export default BookmarkUpdatesList;
