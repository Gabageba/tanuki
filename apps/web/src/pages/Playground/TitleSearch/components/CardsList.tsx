import { SimpleGrid } from '@mantine/core';
import { VIEW_MODE, type Title } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard';

type Props = {
  items: Title[];
  cols: number;
};

/** Вид «список»: те же `TitleListCard`, что в каталоге. */
function CardsList({ items, cols }: Props) {
  return (
    <SimpleGrid cols={cols} spacing="sm">
      {items.map((title) => (
        <TitleCard key={title.id} title={title} viewMode={VIEW_MODE.LIST} />
      ))}
    </SimpleGrid>
  );
}

export default CardsList;
