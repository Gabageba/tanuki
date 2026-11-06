import { Stack, Text } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import MockTitleCardImage from './MockTitleCardImage';
import type { ContinueItem } from '../models';
import ContinueMetaLine from './ContinueMetaLine';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  item: ContinueItem;
  onRemove: () => void;
};

/** C1 — та же узкая карточка, что в подборках: лента источника на обложке, под названием — глава
 *  и время. Строка с «⋯» вынесена из ссылки: кнопка внутри `<a>` недопустима. */
function ContinueNarrowCard({ item, onRemove }: Props) {
  return (
    <Stack gap={4}>
      <NavigateToTitleCard titleId={item.title.id} viewMode={VIEW_MODE.GRID}>
        <Stack gap={8}>
          <MockTitleCardImage title={item.title} showBadges showSource />
          <Text className={styles.title} lineClamp={2} lh="tight">
            {item.title.name}
          </Text>
        </Stack>
      </NavigateToTitleCard>
      <ContinueMetaLine item={item} onRemove={onRemove} />
    </Stack>
  );
}

export default ContinueNarrowCard;
