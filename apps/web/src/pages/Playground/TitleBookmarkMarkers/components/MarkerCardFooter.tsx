import { Box, Group, Text } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import SourceTitleFooter from '@/entities/source/components/SourceTitleCard/components/SourceTitleFooter';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import {
  TITLE_CARD_LIST_SIZE,
  type TitleCardListSize,
} from '@/entities/title/card/TitleCard/models';

type Props = { title: Title; listSize: TitleCardListSize; truncateDetails?: boolean };

function MarkerCardFooter({ title, listSize, truncateDetails = false }: Props) {
  switch (listSize) {
    case TITLE_CARD_LIST_SIZE.REGULAR:
      return <SourceTitleFooter title={title} />;
    case TITLE_CARD_LIST_SIZE.COMPACT:
      return (
        <Group gap={8} wrap="nowrap">
          <Text
            fz="sm"
            fw={600}
            ff="monospace"
            c="var(--mantine-primary-color-filled)"
            lh="tight"
            flex="none"
            style={{ whiteSpace: 'nowrap' }}
          >
            +3&nbsp;гл.
          </Text>
          {truncateDetails ? (
            <Text fz="xs" c="dimmed" lh="tight" truncate flex={1} miw={0}>
              <Box component="span" ff="monospace">
                Гл.&nbsp;327
              </Box>
              {' · 2 ч назад'}
            </Text>
          ) : (
            <TitleMetaItems
              gap={4}
              items={[
                <Box key="chapter" component="span" ff="monospace" lh="tight">
                  Гл.&nbsp;327
                </Box>,
                '2 ч назад',
              ]}
            />
          )}
        </Group>
      );
  }
}

export default MarkerCardFooter;
