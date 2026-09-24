import { Flex, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getChapterMarks, toStackItems } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** Три иконки по 20px с перекрытием в треть — слот одной ширины во всех строках. */
const STACK_SLOT_WIDTH = 48;

/**
 * A1: стопка сразу за кругом, перед номером главы. Слот есть и в пустых строках, поэтому
 * иконки встают одной колонкой вдоль линии, а номера глав не прыгают.
 */
function RowsStackNearNode({ demo }: Props) {
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
              <Flex w={STACK_SLOT_WIDTH} flex="none" align="center">
                {marks.length > 0 && (
                  <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                    <UnstyledButton>
                      <SourceStack
                        items={toStackItems(marks)}
                        approximateStyle={demo.approximateStyle}
                        size={20}
                        max={3}
                      />
                    </UnstyledButton>
                  </MarksPopover>
                )}
              </Flex>
            }
          />
        );
      }}
    />
  );
}

export default RowsStackNearNode;
