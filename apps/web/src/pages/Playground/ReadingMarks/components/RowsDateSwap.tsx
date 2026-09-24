import { Group, Text, UnstyledButton } from '@mantine/core';
import useDateFormat from '@/shared/hooks/useDateFormat';
import type { DemoState } from '../models';
import { getChapterMarks, getCompactApproximateStyle, toStackItems } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';

type Props = {
  demo: DemoState;
};

/**
 * K: в строке с отметками дата загрузки уступает место иконкам и тому, когда там читали. Ширина
 * строки не меняется, название не сжимается; на мобилке, где даты нет, колонка появляется только
 * в этих строках.
 */
function RowsDateSwap({ demo }: Props) {
  const { formatRelative } = useDateFormat();

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        const [freshest] = marks;
        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            meta={
              freshest && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton flex="none">
                    <Group gap={6} wrap="nowrap">
                      <SourceStack
                        items={toStackItems(marks)}
                        approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                        size={16}
                        max={2}
                      />
                      <Text fz={12} c="dimmed">
                        {formatRelative(freshest.mark.progress.updatedAt)}
                      </Text>
                    </Group>
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

export default RowsDateSwap;
