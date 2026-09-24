import type { ReactNode } from 'react';
import { Box, Stack } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import { CHAPTER_READ_STATUS, type ChapterReadStatus } from '@/entities/title/models';
import type { DemoState } from '../models';
import styles from '../ReadingMarks.module.scss';

const LANE_WIDTH = 18;

type Props = {
  demo: DemoState;
  status: ChapterReadStatus;
  color: string;
  isApproximate?: boolean;
  /** Своя линия видна и там, где не прочитано, — серой, как обычный таймлайн. */
  isMain?: boolean;
  node: ReactNode;
};

/**
 * Одна дорожка в строке: верхняя и нижняя половины линии и середина — узел на главе отметки,
 * сплошной отрезок на прочитанной главе, пусто на непрочитанной.
 */
function GitLane({ demo, status, color, isApproximate = false, isMain = false, node }: Props) {
  const isReadBelow = demo.direction === SORT_DIRECTION.DESC;
  const isOlderActive = status !== CHAPTER_READ_STATUS.UNREAD;
  const isNewerActive = status === CHAPTER_READ_STATUS.READ;
  const lineProps = {
    style: {
      '--lane-color': color,
      '--lane-base': isMain ? 'var(--mantine-color-default-border)' : 'transparent',
    },
    'data-approximate': isApproximate || undefined,
  };

  return (
    <Stack gap={0} align="center" w={LANE_WIDTH} flex="none">
      <Box
        className={styles.lane}
        data-active={(isReadBelow ? isNewerActive : isOlderActive) || undefined}
        {...lineProps}
      />
      {status === CHAPTER_READ_STATUS.CURRENT ? (
        node
      ) : (
        <Box
          className={styles.laneSegment}
          data-active={status === CHAPTER_READ_STATUS.READ || undefined}
          {...lineProps}
        />
      )}
      <Box
        className={styles.lane}
        data-active={(isReadBelow ? isOlderActive : isNewerActive) || undefined}
        {...lineProps}
      />
    </Stack>
  );
}

export default GitLane;
