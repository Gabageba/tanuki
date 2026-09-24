import { Box, Tooltip } from '@mantine/core';
import type { DemoState } from '../models';
import {
  getChapterMarks,
  getCompactApproximateStyle,
  getCoveringMarks,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * R: узел — не «прочитано/нет», а доля источников, где эта глава прочитана: круг заполняется
 * сектором, как диаграмма. Полный — прочитано везде, пустой — нигде. Там, где сектор убывает,
 * кто-то остановился — у этой главы мелкие иконки. Наведите на узел — кто её прочитал.
 */
function RowsCoverage({ demo }: Props) {
  const sourceCount = (demo.own ? 1 : 0) + demo.placed.length;

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const covering = getCoveringMarks(demo, chapter);
        const marks = getChapterMarks(demo, chapter.id);
        const isOwn = demo.own?.chapter.id === chapter.id;
        const share = sourceCount === 0 ? 0 : covering.length / sourceCount;
        const tooltip =
          covering.length === 0
            ? 'Нигде не прочитано'
            : `Прочитано: ${covering.map((item) => item.mark.source.title).join(', ')}`;

        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            node={
              <Tooltip label={tooltip} withinPortal multiline maw={260}>
                <Box
                  className={styles.coverageNode}
                  data-own={isOwn || undefined}
                  style={{ '--coverage': `${share * 360}deg` }}
                />
              </Tooltip>
            }
            trailing={
              marks.length > 0 && (
                <SourceStack
                  items={toStackItems(marks)}
                  approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                  size={14}
                  max={3}
                />
              )
            }
          />
        );
      }}
    />
  );
}

export default RowsCoverage;
