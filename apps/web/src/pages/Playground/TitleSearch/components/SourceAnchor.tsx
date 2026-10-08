import { Badge, Button, Pill, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ANCHOR_STYLE, type AnchorStyle, type FoundGroup } from '../models';

type Props = {
  group: FoundGroup;
  anchorStyle: AnchorStyle;
};

/** Один чип «Нашлось на:» — логотип, название, число карточек; вид — по оси C. */
function SourceAnchor({ group: { source, items }, anchorStyle }: Props) {
  const icon = <SourceIcon id={source.id} title={source.title} size={16} />;
  const count = (
    <Text span fz="xs" ff="monospace" c="dimmed">
      {items.length}
    </Text>
  );

  switch (anchorStyle) {
    case ANCHOR_STYLE.ROUND:
    case ANCHOR_STYLE.DEFAULT:
      return (
        <Button
          variant="default"
          size="compact-sm"
          radius={anchorStyle === ANCHOR_STYLE.ROUND ? 'xl' : undefined}
          leftSection={icon}
          rightSection={count}
        >
          {source.title}
        </Button>
      );
    case ANCHOR_STYLE.BADGE:
      return (
        <Badge
          component="button"
          variant="muted"
          color="gray"
          size="lg"
          tt="none"
          fw={400}
          leftSection={icon}
          rightSection={count}
          style={{ cursor: 'pointer' }}
        >
          {source.title}
        </Badge>
      );
    case ANCHOR_STYLE.PILL:
      return (
        <Pill component="button" variant="muted" size="md" style={{ cursor: 'pointer' }}>
          <Text span fz="sm" display="inline-flex" style={{ alignItems: 'center', gap: 6 }}>
            {icon}
            {source.title}
            {count}
          </Text>
        </Pill>
      );
  }
}

export default SourceAnchor;
