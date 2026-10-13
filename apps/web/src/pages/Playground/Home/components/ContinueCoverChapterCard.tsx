import { Box, Stack, Text } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import TitleCardImage from '@/entities/title/TitleCardImage';
import type { ContinueItem } from '../models';
import ContinueChapter from './ContinueChapter';
import ContinueMetaLine from './ContinueMetaLine';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  item: ContinueItem;
  onRemove: () => void;
};

/** C3 — узкая карточка, глава плашкой внизу обложки: где остановился, видно раньше названия. */
function ContinueCoverChapterCard({ item, onRemove }: Props) {
  return (
    <Stack gap={4}>
      <NavigateToTitleCard titleId={item.title.id} viewMode={VIEW_MODE.GRID}>
        <Stack gap={8}>
          <Box pos="relative" bdrs="md" style={{ overflow: 'hidden' }}>
            <TitleCardImage title={item.title} showBadges showSource />
            {/* Затемнение всегда тёмное, в обеих схемах: плашка лежит на картинке, а не на фоне. */}
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              right={0}
              px={8}
              pt="lg"
              pb={6}
              bg="linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0))"
            >
              <Text c="white" fz="sm" fw={600} lh="tight" truncate>
                <ContinueChapter item={item} />
              </Text>
            </Box>
          </Box>
          <Text className={styles.title} lineClamp={2} lh="tight">
            {item.title.name}
          </Text>
        </Stack>
      </NavigateToTitleCard>
      <ContinueMetaLine item={item} withChapter={false} onRemove={onRemove} />
    </Stack>
  );
}

export default ContinueCoverChapterCard;
