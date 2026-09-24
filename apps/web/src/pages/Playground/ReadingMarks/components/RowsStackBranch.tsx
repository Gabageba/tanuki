import { Flex, UnstyledButton } from '@mantine/core';
import { APPROXIMATE_STYLE, type DemoState } from '../models';
import {
  getChapterMarks,
  getMaxChapterMarkCount,
  getStackWidth,
  isApproximate,
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

/** Ветка уходит назад, в отступ между кругом и слотом, и дотягивается до самого круга. */
const ROW_GAP = 12;
const BRANCH_LENGTH = 10;
const ICON_SIZE = 20;
const MAX_ICONS = 3;
/** «≈ примерно» мелким шрифтом под стопкой. */
const CAPTION_WIDTH = 52;

/**
 * A2: как A1, но от круга к стопке тянется ветка. Ширина слота не фиксирована, а считается
 * один раз на весь список — под самую большую стопку в этой ветке; нет отметок — нет и слота.
 */
function RowsStackBranch({ demo }: Props) {
  const stackWidth = getStackWidth(getMaxChapterMarkCount(demo), ICON_SIZE, MAX_ICONS);
  const withCaption =
    demo.approximateStyle === APPROXIMATE_STYLE.CAPTION &&
    demo.placed.some((item) => isApproximate(item.confidence));
  const slotWidth =
    stackWidth === 0 ? 0 : BRANCH_LENGTH + Math.max(stackWidth, withCaption ? CAPTION_WIDTH : 0);

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
              slotWidth > 0 && (
                <Flex w={slotWidth} flex="none" align="center">
                  {marks.length > 0 && (
                    <>
                      <MarksBranch marks={marks} width={ROW_GAP + BRANCH_LENGTH} ml={-ROW_GAP} />
                      <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                        <UnstyledButton>
                          <SourceStack
                            items={toStackItems(marks)}
                            approximateStyle={demo.approximateStyle}
                            size={ICON_SIZE}
                            max={MAX_ICONS}
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

export default RowsStackBranch;
