import { Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import TitleAdultTag from '@/entities/title/markers/TitleAdultTag';
import {
  AGE_BADGE_POSITION,
  CARD_DENSITY,
  FOLDER_MARK,
  FOLDER_MARK_POSITION,
  META_LAYOUT,
  type CardOptions,
  type Example,
} from '../models';
import { getFolderPresentation } from '../lib';
import CoverlessFolderMark from './CoverlessFolderMark';
import CoverlessDescription from './CoverlessDescription';
import CoverlessMeta from './CoverlessMeta';
import CoverlessFooter from './CoverlessFooter';
import PlacedFolderDecoration from './PlacedFolderDecoration';
import styles from '../CoverlessTitleCard.module.scss';

type Props = CardOptions & { example: Example };

function CoverlessCard({
  example,
  density = CARD_DENSITY.SHORT,
  folderMark = FOLDER_MARK.HEADING_NAME,
  folderDecoration,
  metaLayout = META_LAYOUT.FOOTER,
  tagLines = 1,
  ageBadgePosition = AGE_BADGE_POSITION.HEADING_START,
}: Props) {
  const { title, folder } = example;
  const { inHeading, withName } = getFolderPresentation(folderMark);
  const folderLabel = folder ? `; папка: ${folder.name}` : '';
  const ageBadge = <TitleAdultTag contentRating={title.contentRating} />;
  const getAgeBadgeSlots = () => {
    switch (ageBadgePosition) {
      case AGE_BADGE_POSITION.HEADING_START:
        return { start: ageBadge, end: null };
      case AGE_BADGE_POSITION.HEADING_END:
        return { start: null, end: ageBadge };
    }
  };
  const ageBadgeSlots = getAgeBadgeSlots();

  return (
    <Card
      component={Link}
      to={getTitleCardPath(title.id)}
      aria-label={`${title.name}${folderLabel}`}
      data-coverless-card
      className={styles.card}
      pos="relative"
      p="sm"
      c="inherit"
      td="none"
      withBorder
    >
      <Stack gap={8}>
        <Group gap={8} wrap="nowrap" align="flex-start">
          <PlacedFolderDecoration
            folder={folder}
            decoration={folderDecoration}
            position={FOLDER_MARK_POSITION.HEADING_START}
          />
          {metaLayout === META_LAYOUT.FOOTER && ageBadgeSlots.start}
          {!folderDecoration && inHeading && !withName && (
            <CoverlessFolderMark folder={folder} withName={false} />
          )}
          <Text
            className={styles.name}
            lineClamp={2}
            lh="tight"
            flex={1}
            miw={0}
            title={title.name}
          >
            {title.name}
          </Text>
          {metaLayout === META_LAYOUT.FOOTER && ageBadgeSlots.end}
          {!folderDecoration && inHeading && withName && (
            <CoverlessFolderMark folder={folder} withName />
          )}
          <PlacedFolderDecoration
            folder={folder}
            decoration={folderDecoration}
            position={FOLDER_MARK_POSITION.HEADING_END}
          />
        </Group>
        <CoverlessMeta
          example={example}
          folderMark={folderMark}
          folderDecoration={folderDecoration}
          metaLayout={metaLayout}
        />
        <CoverlessDescription description={title.description} lines={density} />
        <CoverlessFooter
          example={example}
          layout={metaLayout}
          tagLines={tagLines}
          folderDecoration={folderDecoration}
        />
      </Stack>
    </Card>
  );
}

export default CoverlessCard;
