import { Box, Stack, Text, UnstyledButton } from '@mantine/core';
import { CircleDashedIcon, CircleIcon } from '@phosphor-icons/react';
import { TIMELINE_ZONE, type DemoState, type TimelineZone } from '../models';
import { getChapterMarks, getTimelineZone, hasApproximateMarks } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

const isReadHere = (zone: TimelineZone | undefined) =>
  zone === TIMELINE_ZONE.READ || zone === TIMELINE_ZONE.CURRENT;

const isReadAnywhere = (zone: TimelineZone | undefined) =>
  isReadHere(zone) || zone === TIMELINE_ZONE.ELSEWHERE;

/**
 * J: чужие отметки не рисуются по одной — вместо них продолжение таймлайна. От своей отметки до
 * самой дальней чужой линия идёт пунктиром, круги — пунктирные: «это вы уже читали, но не здесь».
 * Отметки позади своей не показываются вовсе — те главы и так прочитаны. Где кончается пунктир,
 * подписано, кто туда дошёл.
 */
function RowsReadElsewhere({ demo }: Props) {
  const zones = demo.chapters.map((_, index) => getTimelineZone(demo, index));

  const renderLine = (zone: TimelineZone, neighbour: TimelineZone | undefined) => {
    const isActive = isReadHere(zone) && isReadHere(neighbour ?? zone);
    const isElsewhere =
      !isActive && isReadAnywhere(zone) && isReadAnywhere(neighbour ?? TIMELINE_ZONE.UNREAD);
    return (
      <Box
        className={styles.timelineLine}
        data-active={isActive || undefined}
        data-elsewhere={isElsewhere || undefined}
      />
    );
  };

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const zone = zones[index]!;
        const marks = getChapterMarks(demo, chapter.id);
        const isEdge = zone === TIMELINE_ZONE.ELSEWHERE && marks.length > 0;

        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timeline={
              <Stack gap={4} align="center" w={18} flex="none">
                {renderLine(zone, zones[index - 1])}
                {zone === TIMELINE_ZONE.ELSEWHERE ? (
                  <CircleDashedIcon
                    size={18}
                    weight="bold"
                    color="var(--mantine-primary-color-filled)"
                  />
                ) : (
                  <CircleIcon
                    size={18}
                    weight={zone === TIMELINE_ZONE.CURRENT ? 'fill' : 'bold'}
                    color={
                      zone === TIMELINE_ZONE.UNREAD
                        ? 'var(--mantine-color-default-border)'
                        : 'var(--mantine-primary-color-filled)'
                    }
                  />
                )}
                {renderLine(zone, zones[index + 1])}
              </Stack>
            }
            trailing={
              isEdge && (
                <MarksPopover demo={demo} marks={marks.map((item) => item.mark)} withContinue>
                  <UnstyledButton flex="none">
                    <Text
                      fz={12}
                      c="dimmed"
                      td="underline"
                      style={{ textDecorationStyle: 'dotted' }}
                    >
                      {hasApproximateMarks(marks) && '≈ '}
                      {marks[0]!.mark.source.title}
                      {marks.length > 1 && ` +${marks.length - 1}`}
                    </Text>
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

export default RowsReadElsewhere;
