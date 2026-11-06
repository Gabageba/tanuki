import { AspectRatio, Box, Group, Stack, Text } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import MockTitleCardImage from './MockTitleCardImage';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import type { ContinueItem } from '../models';
import ContinueActionsMenu from './ContinueActionsMenu';
import ContinueChapter from './ContinueChapter';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  item: ContinueItem;
  onRemove: () => void;
};

/** C1 по выбору — порядок как у `TitleGridCard`: обложка, «Гл. 12 · 2 дня назад», название. Вся
 *  карточка — одна ссылка; «⋯» лежит поверх неё на высоте мета-строки (кнопка внутри `<a>`
 *  недопустима): прозрачный слой повторяет обложку, чтобы кнопка встала ровно под ней. */
function ContinueMetaFirstCard({ item, onRemove }: Props) {
  return (
    <Box pos="relative">
      <NavigateToTitleCard titleId={item.title.id} viewMode={VIEW_MODE.GRID}>
        <Stack gap={8}>
          <MockTitleCardImage title={item.title} showBadges showSource />
          <Stack gap={4}>
            <Box pr={28} mih={22} display="flex" style={{ alignItems: 'center' }}>
              <TitleMetaItems
                gap={4}
                items={[<ContinueChapter key="chapter" item={item} />, item.readAgo]}
              />
            </Box>
            <Text className={styles.title} lineClamp={2} lh="tight">
              {item.title.name}
            </Text>
          </Stack>
        </Stack>
      </NavigateToTitleCard>
      <Stack gap={8} pos="absolute" top={0} left={0} right={0} style={{ pointerEvents: 'none' }}>
        <AspectRatio ratio={3 / 4} />
        <Group justify="flex-end" style={{ pointerEvents: 'auto' }} w="fit-content" ml="auto">
          <ContinueActionsMenu onRemove={onRemove} />
        </Group>
      </Stack>
    </Box>
  );
}

export default ContinueMetaFirstCard;
