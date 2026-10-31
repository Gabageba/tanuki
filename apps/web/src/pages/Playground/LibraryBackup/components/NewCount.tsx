import { Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import { formatCount, NBSP } from '../lib';

type Props = {
  value: number;
  /** Сокращение после числа — «гл.». */
  unit?: string;
};

/** Число справа в строке: «+42» моноширинным, ноль — тире. */
function NewCount({ value, unit }: Props) {
  if (value === 0) {
    return <Mdash c="dimmed" fz="sm" />;
  }

  return (
    <Text ff="monospace" fz="sm" style={{ whiteSpace: 'nowrap' }}>
      +{formatCount(value)}
      {unit && `${NBSP}${unit}`}
    </Text>
  );
}

export default NewCount;
