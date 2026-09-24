import { UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getChapterMarks, getCompactApproximateStyle, toStackItems } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/** Круг по центру, справа от него — место под бейдж, чтобы тот не наезжал на номер главы. */
const TIMELINE_WIDTH = 32;

/**
 * A3: круг своего прогресса остаётся, в его углу — маленькая стопка: свежий источник и «+N».
 * Подпись под бейджем в 14px не влезает, поэтому вместо неё здесь бейдж «?».
 */
function RowsNodeBadge({ demo }: Props) {
  const approximateStyle = getCompactApproximateStyle(demo.approximateStyle);

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timelineWidth={TIMELINE_WIDTH}
            nodeBadge={
              marks.length > 0 && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton className={styles.nodeBadge}>
                    <SourceStack
                      items={toStackItems(marks)}
                      approximateStyle={approximateStyle}
                      size={14}
                      max={2}
                    />
                  </UnstyledButton>
                </MarksPopover>
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsNodeBadge;
