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
const ICON_SIZE = 20;
/** Сколько колонка заходит в левый отступ строки (16px) — там и так пусто. */
const PADDING_OVERLAP = 8;

/**
 * A2b: ветка уходит от круга влево, в отступ строки, на конце — иконка и «+N». Номер и название
 * главы не сдвигаются вовсе: справа от линии всё как без отметок.
 */
function RowsBranchLeft({ demo }: Props) {
  const hasGutter = getMaxChapterMarkCount(demo) > 0;
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
            gutter={
              hasGutter && (
                <Flex w={ICON_SIZE} ml={-PADDING_OVERLAP} flex="none" align="center">
                  {marks.length > 0 && (
                    <>
                      <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                        <UnstyledButton>
                          <SourceCounterIcon
                            items={toStackItems(marks)}
                            approximateStyle={approximateStyle}
                            size={ICON_SIZE}
                          />
                        </UnstyledButton>
                      </MarksPopover>
                      <MarksBranch marks={marks} width={ROW_GAP} />
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

export default RowsBranchLeft;
