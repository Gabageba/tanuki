import { Button, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getSourceSectionId } from '../lib';
import type { FoundGroup } from '../models';

type Props = {
  group: FoundGroup;
};

/** Чип «Нашлось на:» — логотип, название и сколько карточек; клик прокручивает к секции. */
function FoundOnChip({ group: { source, items } }: Props) {
  return (
    <Button
      variant="default"
      size="compact-sm"
      leftSection={<SourceIcon id={source.id} title={source.title} size={16} />}
      rightSection={
        <Text span fz="xs" ff="monospace" c="dimmed">
          {items.length}
        </Text>
      }
      onClick={() =>
        document
          .getElementById(getSourceSectionId(source.id))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    >
      {source.title}
    </Button>
  );
}

export default FoundOnChip;
