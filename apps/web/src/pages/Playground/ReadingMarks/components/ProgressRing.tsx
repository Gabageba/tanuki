import { useRef } from 'react';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import type { DemoState } from '../models';
import {
  getChapterMarks,
  getCompactApproximateStyle,
  getFurthestPlacedMark,
  getReadCount,
  getReadingOrder,
  getReadingPosition,
  toStackItems,
} from '../lib';
import MarkLine from './MarkLine';
import PlainChapterList from './PlainChapterList';
import SourceCounterIcon from './SourceCounterIcon';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

const SIZE = 168;
const RING_RADIUS = 52;
const RING_WIDTH = 10;
const PIN_RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Q: кольцо прогресса вместо полосы — для шапки тайтла рядом с обложкой. Внутри — «6 / 12»,
 * по кольцу — своя дуга и светлая до самой дальней чужой, снаружи — иконки источников на своих
 * местах. Справа — список отметок с «к главе».
 */
function ProgressRing({ demo }: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const readingOrder = getReadingOrder(demo);
  const total = readingOrder.length;
  const ownCount = getReadCount(demo, demo.own?.chapter);
  const furthestCount = Math.max(
    ownCount,
    getReadCount(demo, getFurthestPlacedMark(demo)?.chapter),
  );
  const getDash = (count: number) => `${(count / total) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  const markedChapters = readingOrder.filter(
    (chapter) => getChapterMarks(demo, chapter.id).length > 0,
  );

  const getPinPosition = (count: number) => {
    const angle = (count / total) * 2 * Math.PI - Math.PI / 2;
    return {
      left: SIZE / 2 + PIN_RADIUS * Math.cos(angle),
      top: SIZE / 2 + PIN_RADIUS * Math.sin(angle),
    };
  };

  return (
    <Stack ref={scopeRef} gap="md">
      <Group gap="lg" align="center" wrap="wrap">
        <Box pos="relative" w={SIZE} h={SIZE} flex="none">
          <svg width={SIZE} height={SIZE} className={styles.ring}>
            <circle
              r={RING_RADIUS}
              cx={SIZE / 2}
              cy={SIZE / 2}
              className={styles.ringTrack}
              strokeWidth={RING_WIDTH}
            />
            <circle
              r={RING_RADIUS}
              cx={SIZE / 2}
              cy={SIZE / 2}
              className={styles.ringElsewhere}
              strokeWidth={RING_WIDTH}
              strokeDasharray={getDash(furthestCount)}
            />
            <circle
              r={RING_RADIUS}
              cx={SIZE / 2}
              cy={SIZE / 2}
              className={styles.ringOwn}
              strokeWidth={RING_WIDTH}
              strokeDasharray={getDash(ownCount)}
            />
          </svg>
          <Stack gap={0} align="center" className={styles.ringCenter}>
            <Text fz={22} fw={600} ff="monospace" lh={1.1}>
              {ownCount}
            </Text>
            <Text fz={12} c="dimmed" ff="monospace">
              из {total}
            </Text>
          </Stack>
          {markedChapters.map((chapter) => {
            const marks = getChapterMarks(demo, chapter.id);
            return (
              <UnstyledButton
                key={chapter.id}
                className={styles.ringPin}
                style={getPinPosition(getReadingPosition(demo, chapter) + 1)}
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
        <Stack gap="sm" flex={1} miw={200}>
          {demo.marks.map((mark) => (
            <MarkLine key={mark.source.id} demo={demo} mark={mark} withGoTo />
          ))}
        </Stack>
      </Group>
      <PlainChapterList demo={demo} />
    </Stack>
  );
}

export default ProgressRing;
