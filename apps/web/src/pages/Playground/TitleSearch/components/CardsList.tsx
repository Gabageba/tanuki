import { SimpleGrid } from '@mantine/core';
import { VIEW_MODE, type Title } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';

type Props = {
  items: Title[];
  cols: number;
};

/** Вид «список»: те же `TitleListCard`, что в каталоге. */
function CardsList({ items, cols }: Props) {
  return (
    <SimpleGrid cols={cols} spacing="sm">
      {items.map((title) => (
        <SourceTitleCard key={title.id} title={title} viewMode={VIEW_MODE.LIST} />
      ))}
    </SimpleGrid>
  );
}

export default CardsList;
