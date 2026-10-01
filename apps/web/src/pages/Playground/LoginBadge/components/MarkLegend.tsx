import { Box, Group, Text } from '@mantine/core';
import { getMarkColor, getMarkLabel, getMutedIconShape } from '../lib';
import type { LoginMark, MarkView, IconSet } from '../models';
import { getMarkIcon } from './lib';
import MutedMarkIcon from './MutedMarkIcon';

type Props = {
  marks: LoginMark[];
  /** Иконка в легенде повторяет пометку в строке — с muted-подложкой, если она там есть. */
  view: MarkView;
  iconSet: IconSet;
};

/** Строка пояснений под списком (L2, L2a–L2c, L5): только те пометки, что в нём есть. */
function MarkLegend({ marks, view, iconSet }: Props) {
  if (marks.length === 0) return null;

  return (
    <Group gap="xs" px="md" mt={6} style={{ rowGap: 4 }}>
      {marks.map((mark) => (
        <Group key={mark} gap={4} wrap="nowrap">
          {getMutedIconShape(view) ? (
            <MutedMarkIcon mark={mark} view={view} iconSet={iconSet} isStatic />
          ) : (
            <Box c={getMarkColor(mark)} lh={0}>
              {getMarkIcon(mark, 14, iconSet)}
            </Box>
          )}
          <Text fz={12} c="dimmed" lh="tight">
            {getMarkLabel(mark)}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

export default MarkLegend;
