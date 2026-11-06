import { Box, Group, Stack, Text } from '@mantine/core';
import { catalogEntryFor, VIEW_MODE } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import MockTitleCardImage from './MockTitleCardImage';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import type { ContinueItem } from '../models';
import ContinueActionsMenu from './ContinueActionsMenu';
import ContinueChapter from './ContinueChapter';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  item: ContinueItem;
  /** Ширина обложки: C2 — 72, крупная первая карточка C4 — 120. */
  coverWidth?: number;
  onRemove: () => void;
};

/** C2 — широкая карточка: обложка слева, справа название, глава, источник и время. Источник —
 *  строкой с логотипом, а не лентой на обложке: на маленькой обложке лента закрыла бы её треть. */
function ContinueWideCard({ item, coverWidth = 72, onRemove }: Props) {
  const isLarge = coverWidth > 72;
  const sourceTitle = catalogEntryFor(item.title.sourceId).title;

  return (
    <Group gap={4} wrap="nowrap" align="flex-start">
      <NavigateToTitleCard titleId={item.title.id} viewMode={VIEW_MODE.GRID} flex={1} miw={0}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Box w={coverWidth} flex="none">
            <MockTitleCardImage title={item.title} showBadges={isLarge} />
          </Box>
          <Stack gap={isLarge ? 8 : 4} miw={0} py={2}>
            <Text
              className={styles.title}
              lineClamp={2}
              lh="tight"
              fz={isLarge ? 'md' : 'sm'}
              fw={isLarge ? 600 : undefined}
            >
              {item.title.name}
            </Text>
            <Text fz="sm" lh="tight" truncate>
              <ContinueChapter item={item} />
            </Text>
            <Group gap={6} wrap="nowrap">
              <SourceIcon id={item.title.sourceId} title={sourceTitle} size={16} />
              <Box miw={0}>
                <TitleMetaItems gap={4} items={[sourceTitle, item.readAgo]} />
              </Box>
            </Group>
          </Stack>
        </Group>
      </NavigateToTitleCard>
      <ContinueActionsMenu onRemove={onRemove} />
    </Group>
  );
}

export default ContinueWideCard;
