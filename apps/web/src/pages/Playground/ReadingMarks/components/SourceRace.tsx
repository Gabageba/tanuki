import { useRef } from 'react';
import { Box, Group, Progress, Stack, Text, UnstyledButton } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoMark, DemoState } from '../models';
import {
  findPlacedMark,
  getChapterLabel,
  getProgressLabel,
  getReadCount,
  hasApproximateSymbol,
  isApproximate,
} from '../lib';
import { OWN_MARK } from '../mocks';
import PlainChapterList from './PlainChapterList';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * M: «гонка» источников. Каждый — своя полоса длиной в прочитанное в этой ветке, сверху кто
 * дальше всех; своя отметка выделена, у чужих — насколько впереди или позади. Примерное место —
 * штриховкой. Строки списка не трогаем.
 */
function SourceRace({ demo }: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const total = demo.chapters.length;
  const ownCount = getReadCount(demo, demo.own?.chapter);

  const racers = [OWN_MARK, ...demo.marks]
    .map((mark) => {
      const placed = mark === OWN_MARK ? demo.own : findPlacedMark(demo, mark);
      return { mark, placed, count: placed ? getReadCount(demo, placed.chapter) : 0 };
    })
    .sort((a, b) => b.count - a.count);

  const renderDelta = (mark: DemoMark, count: number) => {
    if (mark === OWN_MARK || count === 0 || count === ownCount) return null;
    const delta = count - ownCount;
    return (
      <Text
        fz={12}
        ff="monospace"
        flex="none"
        c={delta > 0 ? 'var(--mantine-color-green-text)' : 'dimmed'}
      >
        {delta > 0 ? `+${delta}` : `−${-delta}`}
      </Text>
    );
  };

  return (
    <Stack ref={scopeRef} gap="md">
      <Stack gap={10}>
        {racers.map(({ mark, placed, count }) => {
          const isOwn = mark === OWN_MARK;
          return (
            <UnstyledButton
              key={mark.source.id}
              disabled={!placed}
              className={styles.raceRow}
              data-own={isOwn || undefined}
              onClick={() => placed && demo.onGoToChapter(placed.chapter.id, scopeRef.current)}
            >
              <Group gap={8} wrap="nowrap">
                <SourceIcon id={mark.source.id} title={mark.source.title} size={20} />
                <Stack gap={3} flex={1} miw={0}>
                  <Group gap={6} wrap="nowrap" justify="space-between">
                    <Text fz="sm" fw={isOwn ? 600 : 400} truncate="end">
                      {isOwn ? `Вы · ${mark.source.title}` : mark.source.title}
                    </Text>
                    <Group gap={6} wrap="nowrap" flex="none">
                      {renderDelta(mark, count)}
                      <Text fz={12} c="dimmed" ff="monospace">
                        {placed
                          ? `${hasApproximateSymbol(demo.approximateStyle, placed.confidence) ? '≈ ' : ''}${getChapterLabel(placed.chapter)}`
                          : getProgressLabel(mark.progress)}
                      </Text>
                    </Group>
                  </Group>
                  {placed ? (
                    <Progress
                      size={6}
                      value={(count / total) * 100}
                      color={isOwn ? undefined : 'gray'}
                      striped={isApproximate(placed.confidence)}
                    />
                  ) : (
                    <Box>
                      <Text fz="xs" c="dimmed">
                        Места в этой ветке не нашлось
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
      <PlainChapterList demo={demo} />
    </Stack>
  );
}

export default SourceRace;
