import { useRef } from 'react';
import { Box, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import type { Chapter } from '@tanuki/contracts';
import { TIMELINE_ZONE, type DemoState } from '../models';
import {
  getChapterLabel,
  getChapterMarks,
  getCompactApproximateStyle,
  getReadingOrder,
  getTimelineZone,
  toStackItems,
} from '../lib';
import PlainChapterList from './PlainChapterList';
import SourceCounterIcon from './SourceCounterIcon';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * N: весь тайтл — сетка клеток, по клетке на главу, по строке на том. Залита — прочитано здесь,
 * светлая с пунктиром — дочитано на другом источнике, в углу клетки — кто там остановился. Как
 * GitHub-календарь: 300 глав влезают в пару экранов, тап по клетке — к главе.
 */
function ChapterGrid({ demo }: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);

  const volumes = getReadingOrder(demo).reduce((result, chapter) => {
    result.set(chapter.volume, [...(result.get(chapter.volume) ?? []), chapter]);
    return result;
  }, new Map<number | null, Chapter[]>());

  const renderCell = (chapter: Chapter) => {
    const marks = getChapterMarks(demo, chapter.id);
    return (
      <Tooltip
        key={chapter.id}
        label={`${getChapterLabel(chapter)} · ${chapter.title}`}
        withinPortal
      >
        <UnstyledButton
          className={styles.gridCell}
          data-zone={getTimelineZone(demo, demo.chapters.indexOf(chapter))}
          onClick={() => demo.onGoToChapter(chapter.id, scopeRef.current)}
        >
          <Text span fz="xs" ff="monospace" inherit>
            {chapter.number}
          </Text>
          {marks.length > 0 && (
            <Box className={styles.gridCellMarks}>
              <SourceCounterIcon
                items={toStackItems(marks)}
                approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                size={14}
              />
            </Box>
          )}
        </UnstyledButton>
      </Tooltip>
    );
  };

  return (
    <Stack ref={scopeRef} gap="md">
      <Stack gap={8}>
        {[...volumes].map(([volume, chapters]) => (
          <Group key={volume ?? 'none'} gap={8} wrap="nowrap" align="flex-start">
            {volume !== null && (
              <Text fz={12} c="dimmed" ff="monospace" w={28} flex="none" lh="28px">
                Т. {volume}
              </Text>
            )}
            <Group gap={6}>{chapters.map(renderCell)}</Group>
          </Group>
        ))}
      </Stack>
      <Group gap="md">
        {[
          [TIMELINE_ZONE.READ, 'прочитано здесь'],
          [TIMELINE_ZONE.ELSEWHERE, 'на другом источнике'],
          [TIMELINE_ZONE.UNREAD, 'не прочитано'],
        ].map(([zone, label]) => (
          <Group key={zone} gap={6} wrap="nowrap">
            <Box className={styles.gridLegendCell} data-zone={zone} />
            <Text fz={12} c="dimmed">
              {label}
            </Text>
          </Group>
        ))}
      </Group>
      <PlainChapterList demo={demo} />
    </Stack>
  );
}

export default ChapterGrid;
