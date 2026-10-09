import { useState } from 'react';
import { Button, Center, Stack } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import type { Title } from '@tanuki/contracts';
import CardsGrid from './CardsGrid';

type Props = {
  items: Title[];
  cols: number;
};

/** Один ряд сетки; остальные уже загруженные карточки раскрываются здесь же, без запроса. */
function CardsOneRow({ items, cols }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenCount = items.length - cols;

  return (
    <Stack gap="xs">
      <CardsGrid items={isExpanded ? items : items.slice(0, cols)} cols={cols} />
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

export default CardsOneRow;
