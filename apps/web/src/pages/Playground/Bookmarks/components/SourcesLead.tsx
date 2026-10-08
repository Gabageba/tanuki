import { Group, Text } from '@mantine/core';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { SOURCES_VARIANT, type SourcesVariant } from '../models';
import SourcesButton from './SourcesButton';
import SourcesChip from './SourcesChip';
import SourcesOverlapButton from './SourcesOverlapButton';

type Props = {
  sourceIds: SourceId[];
  /** undefined — оси до Q: иконка с «+N» в углу. */
  sourcesVariant: SourcesVariant | undefined;
};

/** Начало мета-строки: источник, куда ведёт карточка, в виде варианта оси Q. */
function SourcesLead({ sourceIds, sourcesVariant }: Props) {
  const [lead, ...others] = sourceIds;

  if (!lead) return null;
  if (!sourcesVariant) return <SourcesButton sourceIds={sourceIds} />;

  switch (sourcesVariant) {
    case SOURCES_VARIANT.OVERLAP:
      return <SourcesOverlapButton sourceIds={sourceIds} />;
    case SOURCES_VARIANT.CHIP:
      return <SourcesChip sourceIds={sourceIds} />;
    case SOURCES_VARIANT.CHIP_DRAWER:
      return <SourcesChip sourceIds={sourceIds} withDrawerOnPhone />;
    case SOURCES_VARIANT.WORDS:
    case SOURCES_VARIANT.COVER:
    case SOURCES_VARIANT.CARD_MENU:
      return (
        <SourceIcon
          id={lead}
          title={catalogEntryFor(lead).title}
          size={20}
          radius="sm"
          flex="none"
        />
      );
    case SOURCES_VARIANT.CARD_MENU_FOLDERS:
      return (
        <Group gap={4} wrap="nowrap" flex="none">
          <SourceIcon id={lead} title={catalogEntryFor(lead).title} size={20} radius="sm" />
          {others.length > 0 && (
            <Text span fz={12} c="dimmed" ff="monospace">
              +{others.length}
            </Text>
          )}
        </Group>
      );
  }
}

export default SourcesLead;
