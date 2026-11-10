import { Card, Group, Stack } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { VIEW_MODE } from '@tanuki/contracts';
import { TitleCardLayoutContext } from '@/entities/title/card/TitleCard/context';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
// eslint-disable-next-line no-restricted-imports -- В DEV-песочнице A0 показывает настоящий компонент главной для точного сравнения.
import NewChapterRow from '@/pages/Home/components/NewChapterRow';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { CARD_VARIANT, type CardVariant, type ChapterExample } from '../models';
import NewChapterContent from './NewChapterContent';
import NewChapterCover from './NewChapterCover';
import NewChapterCounterCard from './NewChapterCounterCard';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = { example: ChapterExample; variant: CardVariant };

function NewChapterVariantCard({ example, variant }: Props) {
  const { bookmark, folder } = example;

  switch (variant) {
    case CARD_VARIANT.CURRENT:
      return <NewChapterRow bookmark={bookmark} folder={folder} />;
    case CARD_VARIANT.SOFT_ACCENT:
    case CARD_VARIANT.DIMMED:
    case CARD_VARIANT.BADGE:
    case CARD_VARIANT.ICON_BADGE:
    case CARD_VARIANT.NUMBER_BADGE:
    case CARD_VARIANT.COMBINED_META:
    case CARD_VARIANT.COLORED_COUNT:
    case CARD_VARIANT.BOLD_COLORED_COUNT:
      return <NewChapterCounterCard example={example} variant={variant} />;
    case CARD_VARIANT.COMPACT:
    case CARD_VARIANT.TITLE_FIRST:
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
              to={generatePath(ROUTE_PATHS.TITLE, { titleId: bookmark.titleId })}
              aria-label={bookmark.name}
              className={styles.link}
            />
            <Group align="stretch" wrap="nowrap" gap={0}>
              <NewChapterCover bookmark={bookmark} />
              <Stack p={8} flex={1} miw={0} gap={4}>
                <NewChapterContent example={example} variant={variant} />
              </Stack>
            </Group>
          </Card>
        </TitleCardLayoutContext.Provider>
      );
  }
}

export default NewChapterVariantCard;
