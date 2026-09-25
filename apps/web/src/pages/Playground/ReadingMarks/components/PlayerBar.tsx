import { useRef } from 'react';
import { Box, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import {
  getChapterLabel,
  getChapterMarks,
  getCompactApproximateStyle,
  getFurthestPlacedMark,
  getReadCount,
  getReadingOrder,
  getReadingPosition,
  hasApproximateMarks,
  toStackItems,
} from '../lib';
import PlainChapterList from './PlainChapterList';
import SourceCounterIcon from './SourceCounterIcon';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * L: шкала как у видеоплеера. Одна полоса на весь тайтл: залито своё прочитанное, светлее — до
 * самой дальней чужой отметки, над полосой — булавки источников. Тап по булавке — к главе в
 * списке. В строках списка нет ни таймлайна, ни иконок.
 */
function PlayerBar({ demo }: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const readingOrder = getReadingOrder(demo);
  const total = readingOrder.length;
  const toPercent = (count: number) => `${(count / total) * 100}%`;
  const ownCount = getReadCount(demo, demo.own?.chapter);
  const furthestCount = Math.max(
    ownCount,
    getReadCount(demo, getFurthestPlacedMark(demo)?.chapter),
  );
  const markedChapters = readingOrder.filter(
    (chapter) => getChapterMarks(demo, chapter.id).length > 0,
  );
  const [first] = readingOrder;
  const last = readingOrder.at(-1);

  return (
    <Stack ref={scopeRef} gap="md">
      <Stack gap={6} px={10}>
        <Box pos="relative" h={34}>
          {markedChapters.map((chapter) => {
            const marks = getChapterMarks(demo, chapter.id);
            return (
              <UnstyledButton
                key={chapter.id}
                className={styles.playerPin}
                style={{ left: toPercent(getReadingPosition(demo, chapter) + 1) }}
                data-approximate={hasApproximateMarks(marks) || undefined}
                onClick={() => demo.onGoToChapter(chapter.id, scopeRef.current)}
              >
                <SourceCounterIcon
                  items={toStackItems(marks)}
                  approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                  size={20}
                />
              </UnstyledButton>
            );
          })}
        </Box>
        <Box pos="relative" className={styles.playerTrack}>
          <Box className={styles.playerElsewhere} w={toPercent(furthestCount)} />
          <Box className={styles.playerOwn} w={toPercent(ownCount)} />
          {demo.own && (
            <Tooltip label={`Вы: ${getChapterLabel(demo.own.chapter)}`} withinPortal>
              <Box className={styles.playerThumb} style={{ left: toPercent(ownCount) }} />
            </Tooltip>
          )}
        </Box>
        <Group justify="space-between">
          <Text fz={12} c="dimmed" ff="monospace">
            {first && getChapterLabel(first)}
          </Text>
          <Text fz={12} c="dimmed" ff="monospace">
            {ownCount} / {total}
          </Text>
          <Text fz={12} c="dimmed" ff="monospace">
            {last && getChapterLabel(last)}
          </Text>
        </Group>
      </Stack>
      <PlainChapterList demo={demo} />
    </Stack>
  );
}

export default PlayerBar;
