import { Group, Text, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getSourceLoginMarkColor, getSourceLoginMarkLabel } from '../../lib';
import type { SourceLoginMark } from '../../models';
import { getSourceLoginMarkIcon } from './lib';
import { BADGE_ICON_SIZE, BADGE_SIZE } from './models';

type Props = {
  marks: SourceLoginMark[];
};

/** Пояснения к пометкам о входе под списком — только к тем, что в нём есть. */
function SourceLoginBadgeLegend({ marks }: Props) {
  const { t } = useTranslation();

  if (marks.length === 0) return null;

  return (
    <Group gap="xs" px="md" style={{ rowGap: 4 }}>
      {marks.map((mark) => (
        <Group key={mark} gap={4} wrap="nowrap">
          <ThemeIcon
            variant="muted"
            color={getSourceLoginMarkColor(mark)}
            size={BADGE_SIZE}
            radius="sm"
          >
            {getSourceLoginMarkIcon(mark, BADGE_ICON_SIZE)}
          </ThemeIcon>
          <Text fz={12} c="dimmed" lh="tight">
            {getSourceLoginMarkLabel(mark, t)}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

export default SourceLoginBadgeLegend;
