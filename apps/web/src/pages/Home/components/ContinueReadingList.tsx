import { Box, Group, Scroller } from '@mantine/core';
import type { ContinueReadingItem } from '@tanuki/contracts';
import useHideFromContinueReading from '../hooks/useHideFromContinueReading';
import ContinueReadingCard from './ContinueReadingCard';
import ContinueReadingEmpty from './ContinueReadingEmpty';

type Props = {
  items: ContinueReadingItem[];
};

/** Лента «Продолжить чтение»; читать нечего — пустое состояние. */
function ContinueReadingList({ items }: Props) {
  const hide = useHideFromContinueReading();

  if (!items.length) {
    return <ContinueReadingEmpty />;
  }

  return (
    <Scroller>
      <Group gap="md" wrap="nowrap" align="flex-start">
        {items.map((item) => (
          <Box key={item.title.id} w={{ base: 128, sm: 168 }} flex="none">
            <ContinueReadingCard item={item} onRemove={() => hide.mutate(item.title.id)} />
          </Box>
        ))}
      </Group>
    </Scroller>
  );
}

export default ContinueReadingList;
