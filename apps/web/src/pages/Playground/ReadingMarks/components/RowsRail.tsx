import { Box, Flex, Tooltip, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import {
  getChapterIndex,
  getChapterLabel,
  getChapterMarks,
  getCompactApproximateStyle,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import SourceCounterIcon from './SourceCounterIcon';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * H: строки не трогаем. Справа от списка — узкая полоса во всю высоту, как метки поиска на
 * скроллбаре: на ней своя отметка и иконки чужих, по доле в списке. На 300 главах видно всё сразу,
 * без прокрутки; тап по иконке — прокрутка к главе.
 */
function RowsRail({ demo }: Props) {
  const count = demo.chapters.length;
  const getTop = (index: number) => `${((index + 0.5) / count) * 100}%`;
  const ownIndex = getChapterIndex(demo, demo.own?.chapter);
  const markedChapters = demo.chapters.filter(
    (chapter) => getChapterMarks(demo, chapter.id).length > 0,
  );

  return (
    <Flex gap={6} align="stretch">
      <Box flex={1} miw={0}>
        <DemoChaptersCard
          demo={demo}
          renderRow={(chapter, index) => (
            <DemoChapterRow demo={demo} chapter={chapter} index={index} />
          )}
        />
      </Box>
      <Box pos="relative" w={22} flex="none" className={styles.rail}>
        {demo.own && ownIndex !== -1 && (
          <Tooltip label={`Вы: ${getChapterLabel(demo.own.chapter)}`} withinPortal>
            <Box className={styles.railOwn} style={{ top: getTop(ownIndex) }} />
          </Tooltip>
        )}
        {markedChapters.map((chapter) => {
          const marks = getChapterMarks(demo, chapter.id);
          return (
            <UnstyledButton
              key={chapter.id}
              className={styles.railMarker}
              style={{ top: getTop(getChapterIndex(demo, chapter)) }}
              onClick={() => demo.onGoToChapter(chapter.id)}
            >
              <SourceCounterIcon
                items={toStackItems(marks)}
                approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                size={18}
              />
            </UnstyledButton>
          );
        })}
      </Box>
    </Flex>
  );
}

export default RowsRail;
