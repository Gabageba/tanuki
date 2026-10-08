import { Group, Text } from '@mantine/core';
import { ANCHOR_STYLE, type AnchorStyle, type FoundGroup } from '../models';
import SourceAnchor from './SourceAnchor';

type Props = {
  found: FoundGroup[];
  /** H6c — подпись в начале ряда, чипы идут за ней в той же строке. */
  label?: string;
  anchorStyle?: AnchorStyle;
};

/** H4/H6 — чипы-якоря: где нашлось и сколько; клик прокручивает к секции источника. */
function SourceAnchors({ found, label, anchorStyle = ANCHOR_STYLE.ROUND }: Props) {
  return (
    <Group gap="xs">
      {label && (
        <Text c="dimmed" fz="sm">
          {label}
        </Text>
      )}
      {found.map((group) => (
        <SourceAnchor key={group.source.id} group={group} anchorStyle={anchorStyle} />
      ))}
    </Group>
  );
}

export default SourceAnchors;
