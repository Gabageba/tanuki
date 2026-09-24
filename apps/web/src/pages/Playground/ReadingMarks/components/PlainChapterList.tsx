import { ScrollArea, Text } from '@mantine/core';
import type { DemoState } from '../models';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';

type Props = {
  demo: DemoState;
};

const LIST_HEIGHT = 260;

/**
 * Список глав без таймлайна и без чужих отметок — под виджетами L, M, N, Q, которые показывают
 * отметки сами. Невысокий, со своей прокруткой: к нему прокручивает тап по виджету.
 */
function PlainChapterList({ demo }: Props) {
  return (
    <ScrollArea h={LIST_HEIGHT} type="auto">
      <DemoChaptersCard
        demo={demo}
        renderRow={(chapter, index) => (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timeline={false}
            trailing={
              demo.own?.chapter.id === chapter.id && (
                <Text fz={12} c="var(--mantine-primary-color-filled)" flex="none">
                  вы здесь
                </Text>
              )
            }
          />
        )}
      />
    </ScrollArea>
  );
}

export default PlainChapterList;
