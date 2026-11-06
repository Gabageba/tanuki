import { SimpleGrid } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';

type Props = {
  items: Title[];
  cols: number;
};

/** Сетка обложек с переносом — число колонок задаёт вариант, а не окно: рамка телефона уже окна. */
function CardsGrid({ items, cols }: Props) {
  return (
    <SimpleGrid cols={cols} spacing="md">
      {items.map((title) => (
        <SourceTitleCard key={title.id} title={title} />
      ))}
    </SimpleGrid>
  );
}

export default CardsGrid;
