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
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

const ROW_GAP = 12;
const BRANCH_LENGTH = 8;
/** Две иконки по 14px друг под другом влезают в высоту строки. */
const ICON_SIZE = 14;
const MAX_ICONS = 2;

/** A2c: ветка вправо, иконки на её конце идут столбиком вдоль линии — ширина одной иконки. */
function RowsBranchVertical({ demo }: Props) {
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
                          <SourceStack
                            items={toStackItems(marks)}
                            approximateStyle={approximateStyle}
                            size={ICON_SIZE}
                            max={MAX_ICONS}
                            vertical
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

export default RowsBranchVertical;
