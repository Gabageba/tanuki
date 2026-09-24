import { Box } from '@mantine/core';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import type { ReadingMark } from '@/entities/title/models';
import SourceIcon from '@/entities/source/components/SourceIcon';
import useSource from '@/entities/source/hooks/useSource';
import styles from './ChapterList.module.scss';

type Props = {
  /** Отметки на главе, свежие первыми; не пустой. */
  marks: ReadingMark[];
  size: number;
};

/**
 * Иконка самого свежего источника и счётчик «+N» в углу вместо стопки: ширина всегда как у одной
 * иконки, сколько бы источников ни сошлось на главе. Примерное место — иконка приглушена и
 * обведена пунктиром.
 */
function LinkedMarksIcon({ marks, size }: Props) {
  const [lead] = marks;
  const sourceId = lead?.progress.sourceId ?? '';
  const { data: source } = useSource({ sourceId: lead?.progress.sourceId });

  return (
    <Box pos="relative" flex="none" className={styles.markIcon}>
      <SourceIcon
        id={sourceId}
        title={source?.title ?? sourceId}
        size={size}
        data-approximate={lead?.confidence === READING_MARK_CONFIDENCE.APPROXIMATE || undefined}
        className={styles.markSourceIcon}
        radius="sm"
      />
      {marks.length > 1 && (
        <Box component="span" ff="monospace" className={styles.markCount}>
          +{marks.length - 1}
        </Box>
      )}
    </Box>
  );
}

export default LinkedMarksIcon;
