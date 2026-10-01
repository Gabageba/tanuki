import { ActionIcon, ThemeIcon, Tooltip } from '@mantine/core';
import { getMarkColor, getMarkLabel, getMutedIconShape } from '../lib';
import type { LoginMark, MarkView, IconSet } from '../models';
import { getMarkIcon } from './lib';

type Props = {
  mark: LoginMark;
  view: MarkView;
  iconSet: IconSet;
  /** В легенде иконка лишь поясняет — не кнопка и без подсказки. */
  isStatic?: boolean;
};

/** Иконка пометки в той же muted-подложке, что у бейджа (L2a–L2c). */
function MutedMarkIcon({ mark, view, iconSet, isStatic = false }: Props) {
  const shape = getMutedIconShape(view);
  if (!shape) return null;

  const color = getMarkColor(mark);
  const label = getMarkLabel(mark);
  const icon = getMarkIcon(mark, shape.iconSize, iconSet);

  if (isStatic) {
    return (
      <ThemeIcon variant="muted" color={color} size={shape.size} radius={shape.radius}>
        {icon}
      </ThemeIcon>
    );
  }

  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="muted"
        color={color}
        size={shape.size}
        radius={shape.radius}
        flex="none"
        aria-label={label}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}

export default MutedMarkIcon;
