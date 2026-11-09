import { useId } from 'react';
import { Box, Card, Group, Stack } from '@mantine/core';
import { Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardCover from '@/entities/title/card/TitleCard/components/TitleCardCover/TitleCardCover';
import TitleCardDescription from '@/entities/title/card/TitleCard/components/TitleCardList/TitleCardDescription';
import TitleCardName from '@/entities/title/card/TitleCard/components/TitleCardName/TitleCardName';
import { TitleCardLayoutContext } from '@/entities/title/card/TitleCard/context';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import { TITLE_CARD_LIST_SIZE, type TitleCardData } from '@/entities/title/card/TitleCard/models';
import { CARD_VARIANT, type ChapterExample, type MetaVariant } from '../models';
import NewChapterFooter from './NewChapterFooter';
import NewChapterMetaRow from './NewChapterMetaRow';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = { example: ChapterExample; variant: MetaVariant };

/** Локальная копия списка TitleCard: варианты меняют только слоты мета-строки. */
function NewChapterMetaCard({ example, variant }: Props) {
  const folderId = useId();
  const { bookmark, folder } = example;
  const data: TitleCardData = { ...bookmark, id: bookmark.titleId, bookmarkFolder: folder };

  return (
    <TitleCardLayoutContext.Provider
      value={{ viewMode: VIEW_MODE.LIST, listSize: TITLE_CARD_LIST_SIZE.COMPACT }}
    >
      <Card
        data-title-card
        data-view-mode={VIEW_MODE.LIST}
        className={styles.card}
        pos="relative"
        p={0}
        c="inherit"
        withBorder
      >
        <Link
          to={getTitleCardPath(data.id)}
          aria-label={data.name}
          aria-describedby={folder ? folderId : undefined}
          className={styles.link}
        />
        <Group align="stretch" wrap="nowrap" gap={0}>
          <TitleCardCover data={data} />
          <Stack p="sm" flex={1} miw={0} gap={8}>
            <Stack className={styles.heading} gap={8} flex={1}>
              <NewChapterMetaRow example={example} variant={variant} folderId={folderId} />
              <TitleCardName data={data} />
              <TitleCardDescription description={data.description} />
            </Stack>
            <Box data-card-footer className={styles.footer}>
              <NewChapterFooter bookmark={bookmark} variant={CARD_VARIANT.COLORED_COUNT} />
            </Box>
          </Stack>
        </Group>
      </Card>
    </TitleCardLayoutContext.Provider>
  );
}

export default NewChapterMetaCard;
