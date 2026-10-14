import { Chip, Group, Scroller } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
};

/** P3a — источники чипами с логотипом и названием; строка листается, если не влезла. */
function SourcePickerChips({ sources, activeId, onChange }: Props) {
  return (
    <Scroller>
      <Chip.Group value={activeId} onChange={onChange}>
        <Group gap="xs" wrap="nowrap">
          {sources.map((source) => (
            <Chip key={source.id} value={source.id} variant="outline" icon={null}>
              <Group gap={6} wrap="nowrap">
                <SourceIcon id={source.id} title={source.title} size={18} />
                {source.title}
              </Group>
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Scroller>
  );
}

export default SourcePickerChips;
