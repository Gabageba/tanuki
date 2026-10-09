import { SimpleGrid } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard';

type Props = {
  items: Title[];
  cols: number;
};

/** Сетка обложек с переносом — число колонок задаёт вариант, а не окно: рамка телефона уже окна. */
function CardsGrid({ items, cols }: Props) {
  return (
    <SimpleGrid cols={cols} spacing="md">
      {items.map((title) => (
        <TitleCard key={title.id} title={title} />
      ))}
    </SimpleGrid>
  );
}

export default CardsGrid;
