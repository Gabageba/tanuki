import { Box, Group } from '@mantine/core';
import ContinueReadingCardSkeleton from './ContinueReadingCardSkeleton';
import { CONTINUE_READING_CARD_WIDTH } from '../models';

/** Карточек в скелетоне — с запасом на широкий экран, лишние обрезаются. */
const CARDS_COUNT = 8;

function ContinueReadingSkeleton() {
  return (
    <Group gap="md" wrap="nowrap" align="flex-start" style={{ overflow: 'hidden' }}>
      {Array.from({ length: CARDS_COUNT }).map((_, index) => (
        <Box key={index} w={CONTINUE_READING_CARD_WIDTH} flex="none">
          <ContinueReadingCardSkeleton />
        </Box>
      ))}
    </Group>
  );
}

export default ContinueReadingSkeleton;
