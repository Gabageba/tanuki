import { Badge } from '@mantine/core';
import { formatNewCount } from '../lib';

type Props = {
  count: number;
  /** Поверх обложки — залитый: muted-подложка на картинке не читается. */
  onCover?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

/** Счётчик новых глав «+3» / «99+». Нет новых — нет счётчика. */
function NewCountBadge({ count, onCover = false, size = 'sm' }: Props) {
  if (count <= 0) return null;

  return (
    <Badge
      variant={onCover ? 'filled' : 'muted'}
      size={size}
      ff="monospace"
      fw={600}
      radius={onCover ? 'md' : undefined}
      flex="none"
      tt="none"
    >
      {formatNewCount(count)}
    </Badge>
  );
}

export default NewCountBadge;
