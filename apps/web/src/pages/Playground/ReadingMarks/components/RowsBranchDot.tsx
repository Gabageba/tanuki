import { Box, Flex, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getChapterMarks, getMaxChapterMarkCount, toStackItems } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksBranch from './MarksBranch';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

const ROW_GAP = 12;
const BRANCH_LENGTH = 6;
const DOT_SIZE = 6;

/**
 * A2d: у линии — только короткая ветка с точкой: «на этой главе кто-то есть». Сами иконки —
 * справа, перед датой, и только в строках с отметками.
 */
function RowsBranchDot({ demo }: Props) {
  const hasSlot = getMaxChapterMarkCount(demo) > 0;

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
            leading={
              hasSlot && (
                <Flex w={BRANCH_LENGTH + DOT_SIZE} flex="none" align="center">
                  {marks.length > 0 && (
                    <>
                      <MarksBranch marks={marks} width={ROW_GAP + BRANCH_LENGTH} ml={-ROW_GAP} />
                      <Box className={styles.branchDot} />
                    </>
                  )}
                </Flex>
              )
            }
            trailing={
              marks.length > 0 && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton flex="none">
                    <SourceStack
                      items={toStackItems(marks)}
                      approximateStyle={demo.approximateStyle}
                      size={18}
                      max={3}
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

export default RowsBranchDot;
