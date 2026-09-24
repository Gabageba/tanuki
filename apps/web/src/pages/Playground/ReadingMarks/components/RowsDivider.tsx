import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { SORT_DIRECTION } from '@tanuki/contracts';
import { CHAPTER_READ_STATUS } from '@/entities/title/models';
import { getChapterReadStatus } from '@/entities/title/readingProgress';
import type { DemoState, PlacedMark } from '../models';
import {
  getChapterIndex,
  getChapterMarks,
  getCompactApproximateStyle,
  hasApproximateMarks,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * F: строки глав не трогаем вообще. Между главой, где остановились, и следующей встаёт тонкий
 * разделитель, как «Новые сообщения» в чате: иконки и «остановились здесь». Пунктир — место
 * примерное.
 */
function RowsDivider({ demo }: Props) {
  const ownIndex = getChapterIndex(demo, demo.own?.chapter);

  const renderDivider = (index: number, marks: PlacedMark[]) => {
    const status = getChapterReadStatus(index, ownIndex, demo.direction);
    const isApproximate = hasApproximateMarks(marks);

    return (
      <Group gap="sm" wrap="nowrap" align="stretch" className={styles.markDivider}>
        <Stack w={18} flex="none" align="center">
          <Box
            className={styles.timelineLine}
            data-active={status === CHAPTER_READ_STATUS.READ || undefined}
          />
        </Stack>
        <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
          <UnstyledButton flex={1} miw={0}>
            <Group gap={8} wrap="nowrap" h="100%">
              <Box
                className={styles.markDividerLine}
                data-approximate={isApproximate || undefined}
              />
              <SourceStack
                items={toStackItems(marks)}
                approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                size={16}
                max={3}
              />
              <Text fz={12} c="dimmed" flex="none">
                {isApproximate && '≈ '}
                {marks.length > 1 ? 'остановились здесь' : 'остановился здесь'}
              </Text>
              <Box
                className={styles.markDividerLine}
                data-approximate={isApproximate || undefined}
              />
            </Group>
          </UnstyledButton>
        </MarksPopover>
      </Group>
    );
  };

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const marks = getChapterMarks(demo, chapter.id);
        const row = <DemoChapterRow demo={demo} chapter={chapter} index={index} />;
        if (marks.length === 0) return row;

        // Разделитель — на границе прочитанного: в DESC новая глава сверху, в ASC — снизу.
        return demo.direction === SORT_DIRECTION.DESC ? (
          <>
            {renderDivider(index, marks)}
            {row}
          </>
        ) : (
          <>
            {row}
            {renderDivider(index, marks)}
          </>
        );
      }}
    />
  );
}

export default RowsDivider;
