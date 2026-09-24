import { Box } from '@mantine/core';
import type { PlacedMark } from '../models';
import { hasApproximateMarks } from '../lib';
import styles from '../ReadingMarks.module.scss';

type Props = {
  marks: PlacedMark[];
  width: number;
  /** Отрицательный отступ, чтобы ветка дотянулась до круга через gap строки. */
  ml?: number;
};

/** Горизонтальная ветка от круга к иконкам; пунктир — все отметки на главе примерные. */
function MarksBranch({ marks, width, ml }: Props) {
  return (
    <Box
      w={width}
      ml={ml}
      className={styles.branch}
      data-approximate={hasApproximateMarks(marks) || undefined}
    />
  );
}

export default MarksBranch;
