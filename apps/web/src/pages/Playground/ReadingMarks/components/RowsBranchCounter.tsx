import { Flex, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import {
  getChapterMarks,
  getCompactApproximateStyle,
  getMaxChapterMarkCount,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksBranch from './MarksBranch';
import MarksPopover from './MarksPopover';
import SourceCounterIcon from './SourceCounterIcon';

type Props = {
  demo: DemoState;
};

const ROW_GAP = 12;
const BRANCH_LENGTH = 10;
const ICON_SIZE = 20;

/**
 * A2a: ветка вправо, на конце одна иконка свежего источника и «+N». Слот — ветка и одна иконка,
 * сколько бы источников ни сошлось на главе.
 */
function RowsBranchCounter({ demo }: Props) {
  const hasSlot = getMaxChapterMarkCount(demo) > 0;
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
            leading={
              hasSlot && (
                <Flex w={BRANCH_LENGTH + ICON_SIZE} flex="none" align="center">
                  {marks.length > 0 && (
                    <>
                      <MarksBranch marks={marks} width={ROW_GAP + BRANCH_LENGTH} ml={-ROW_GAP} />
                      <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                        <UnstyledButton>
                          <SourceCounterIcon
                            items={toStackItems(marks)}
                            approximateStyle={approximateStyle}
                            size={ICON_SIZE}
                          />
                        </UnstyledButton>
                      </MarksPopover>
                    </>
                  )}
                </Flex>
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsBranchCounter;
