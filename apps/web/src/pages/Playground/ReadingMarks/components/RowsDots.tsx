import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState } from '../models';
import { getChapterMarks, isDimmedApproximate } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/** Точка плюс зазор; колонка точек одной ширины во всех строках — номера глав не прыгают. */
const DOT_STEP = 11;

/** C: у линии — цветные точки источников, какой цвет чей — в легенде над списком. */
function RowsDots({ demo }: Props) {
  const maxDots = Math.max(
    1,
    ...demo.chapters.map((chapter) => getChapterMarks(demo, chapter.id).length),
  );

  return (
    <>
      <Group gap="md" mb="xs">
        {demo.placed.map((item) => (
          <Group key={item.mark.source.id} gap={6} wrap="nowrap">
            <Box
              className={styles.dot}
              style={{ '--dot-color': item.mark.source.color }}
              data-approximate={
                isDimmedApproximate(demo.approximateStyle, item.confidence) || undefined
              }
            />
            <SourceIcon id={item.mark.source.id} title={item.mark.source.title} size={16} />
            <Text fz={12}>{item.mark.source.title}</Text>
          </Group>
        ))}
      </Group>
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
                <Group gap={3} w={maxDots * DOT_STEP} flex="none" wrap="nowrap">
                  {marks.length > 0 && (
                    <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                      <UnstyledButton display="flex" style={{ gap: 3 }}>
                        {marks.map((item) => (
                          <Box
                            key={item.mark.source.id}
                            className={styles.dot}
                            style={{ '--dot-color': item.mark.source.color }}
                            data-approximate={
                              isDimmedApproximate(demo.approximateStyle, item.confidence) ||
                              undefined
                            }
                          />
                        ))}
                      </UnstyledButton>
                    </MarksPopover>
                  )}
                </Group>
              }
            />
          );
        }}
      />
    </>
  );
}

export default RowsDots;
