import type { ReactNode } from 'react';
import { Badge, Box, Stack, Text } from '@mantine/core';
import { VIEW_MODE, type Title } from '@tanuki/contracts';
import NavigateToTitleCard from '@/entities/title/NavigateToTitleCard';
import MockTitleCardImage from './MockTitleCardImage';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import styles from '@/entities/title/Title.module.scss';

type Props = {
  title: Title;
  /** Метка в правом нижнем углу обложки — «+3» новых глав. */
  badge?: string;
  /** Мета-строка над названием — «Гл. 17 · 2 месяца назад». */
  meta?: ReactNode[];
};

/** Узкая карточка ленты главной (W1): как у подборок, с меткой на обложке или своей мета-строкой. */
function MarkedTitleCard({ title, badge, meta = [] }: Props) {
  return (
    <NavigateToTitleCard titleId={title.id} viewMode={VIEW_MODE.GRID}>
      <Stack gap={8}>
        <Box pos="relative">
          <MockTitleCardImage title={title} showSource />
          {badge && (
            <Badge pos="absolute" bottom={6} right={6} variant="filled" ff="monospace">
              {badge}
            </Badge>
          )}
        </Box>
        <Stack gap={4}>
          {meta.length > 0 && <TitleMetaItems gap={4} items={meta} />}
          <Text className={styles.title} lineClamp={2} lh="tight">
            {title.name}
          </Text>
        </Stack>
      </Stack>
    </NavigateToTitleCard>
  );
}

export default MarkedTitleCard;
