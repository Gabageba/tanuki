import { Chip, Group, Scroller } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
};

/** Источники подборок чипами с логотипом (P3a); строка листается, если не влезла. */
function SourceChips({ sources, activeId, onChange }: Props) {
  return (
    <Scroller>
      <Chip.Group value={activeId} onChange={onChange}>
        <Group gap="xs" wrap="nowrap">
          {sources.map((source) => (
            <Chip key={source.id} value={source.id} variant="muted" icon={null}>
              <Group gap={6} wrap="nowrap">
                <SourceIcon id={source.id} title={source.title} size={18} radius="sm" />
                {source.title}
              </Group>
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Scroller>
  );
}

export default SourceChips;
