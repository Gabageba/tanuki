import { Box, Card, Group, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardCover from '@/entities/title/card/TitleCard/components/TitleCardCover/TitleCardCover';
import TitleCardDescription from '@/entities/title/card/TitleCard/components/TitleCardList/TitleCardDescription';
import TitleCardMeta from '@/entities/title/card/TitleCard/components/TitleCardMeta';
import TitleCardMetaRow from '@/entities/title/card/TitleCard/components/TitleCardMetaRow';
import { TitleCardLayoutContext } from '@/entities/title/card/TitleCard/context';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import type {
  TitleCardViewContent,
  TitleCardListSize,
} from '@/entities/title/card/TitleCard/models';
import { MARKER_VARIANT, type MarkerVariant } from '../models';
import MarkerCardName from './MarkerCardName';
import MarkerCoverFlag from './MarkerCoverFlag';
import MarkerFolderPill from './MarkerFolderPill';
import cardStyles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = TitleCardViewContent & { listSize: TitleCardListSize; variant: MarkerVariant };

/** Локальная копия раскладки списка: варианты меняют только положение маркера. */
function MarkerListCardVariant({ data, meta, actions, footer, listSize, variant }: Props) {
  return (
    <TitleCardLayoutContext.Provider value={{ viewMode: VIEW_MODE.LIST, listSize }}>
      <Card
        data-title-card
        data-view-mode={VIEW_MODE.LIST}
        className={cardStyles.card}
        pos="relative"
        p={0}
        c="inherit"
        withBorder
      >
        <Link to={getTitleCardPath(data.id)} aria-label={data.name} className={cardStyles.link} />
        <Group align="stretch" wrap="nowrap" gap={0}>
          <Box pos="relative" display="flex" flex="none">
            <TitleCardCover data={{ ...data, bookmarkFolder: null }} />
            {variant === MARKER_VARIANT.COVER_FLAG && (
              <MarkerCoverFlag folder={data.bookmarkFolder} />
            )}
          </Box>
          <Stack p="sm" flex={1} miw={0} gap={8}>
            <Stack gap={8} flex={1}>
              <TitleCardMetaRow
                meta={<TitleCardMeta contentRating={data.contentRating}>{meta}</TitleCardMeta>}
                actions={actions}
              />
              <MarkerCardName data={data} variant={variant} />
              <TitleCardDescription description={data.description} />
            </Stack>
            <Box data-card-footer className={cardStyles.footer}>
              <Group gap={8} wrap="nowrap">
                {variant === MARKER_VARIANT.FOLDER_PILL && (
                  <MarkerFolderPill folder={data.bookmarkFolder} />
                )}
                <Box flex={1} miw={variant === MARKER_VARIANT.FOLDER_PILL ? 84 : 0}>
                  {footer}
                </Box>
              </Group>
            </Box>
          </Stack>
        </Group>
      </Card>
    </TitleCardLayoutContext.Provider>
  );
}

export default MarkerListCardVariant;
