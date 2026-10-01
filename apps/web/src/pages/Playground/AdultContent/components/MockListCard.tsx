import { Box, Group, Stack, Text } from '@mantine/core';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import NumericMeta from '@/entities/title/NumericMeta';
import type { BlurStyle, MockTitle } from '../models';
import MockCover from './MockCover';

type Props = {
  title: MockTitle;
  blurred: boolean;
  blurStyle: BlurStyle;
};

/** Карточка каталога в виде списка: маленькая обложка слева. */
function MockListCard({ title, blurred, blurStyle }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" p="xs">
      <Box w={56} flex="none">
        <MockCover title={title} blurred={blurred} blurStyle={blurStyle} compact />
      </Box>
      <Stack gap={4} miw={0}>
        <Text lineClamp={2} lh={1.1}>
          {title.name}
        </Text>
        <TitleMetaItems
          gap={4}
          items={[
            title.type,
            <NumericMeta key="year">{title.year}</NumericMeta>,
            <NumericMeta key="volume">{title.chaptersCount}&nbsp;гл.</NumericMeta>,
          ]}
        />
      </Stack>
    </Group>
  );
}

export default MockListCard;
