import { UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import { getChapterMarks } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/** Стопка из двух иконок и «+N» — ширина колонки под неё фиксирована, чтобы линия не гуляла. */
const STACK_NODE_WIDTH = 40;

/**
 * B: чужие отметки заменяют узел на линии стопкой иконок, в строке больше ничего нет. Своя
 * отметка главнее: на её главе узел остаётся кругом, чужие видны только в поповере по тапу.
 */
function RowsStackNode({ demo }: Props) {
  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        const isOwn = demo.own?.chapter.id === chapter.id;
        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timelineWidth={STACK_NODE_WIDTH}
            node={
              marks.length > 0 &&
              !isOwn && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton>
                    <SourceStack
                      items={marks.map((item) => ({
                        source: item.mark.source,
                        confidence: item.confidence,
                      }))}
                      approximateStyle={demo.approximateStyle}
                      size={18}
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

export default RowsStackNode;
