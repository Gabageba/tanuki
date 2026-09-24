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

/** A: узел — всегда круг своего прогресса; чужие отметки — стопкой иконок после названия. */
function RowsStackRight({ demo }: Props) {
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
            trailing={
              marks.length > 0 && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton flex="none">
                    <SourceStack
                      items={marks.map((item) => ({
                        source: item.mark.source,
                        confidence: item.confidence,
                      }))}
                      approximateStyle={demo.approximateStyle}
                      size={20}
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

export default RowsStackRight;
