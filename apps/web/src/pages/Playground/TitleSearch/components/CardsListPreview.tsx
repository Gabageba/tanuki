import { useState } from 'react';
import { Button, Center, Stack } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import type { Title } from '@tanuki/contracts';
import CardsList from './CardsList';

type Props = {
  items: Title[];
  visibleCount: number;
};

/** V — вид «список»: первые карточки, остальные уже пришедшие раскрываются здесь же. */
function CardsListPreview({ items, visibleCount }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenCount = items.length - visibleCount;

  return (
    <Stack gap="xs">
      <CardsList items={isExpanded ? items : items.slice(0, visibleCount)} cols={1} />
      {hiddenCount > 0 && (
        <Center>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? 'Свернуть' : `Показать ещё ${hiddenCount}`}
          </Button>
        </Center>
      )}
    </Stack>
  );
}

export default CardsListPreview;
