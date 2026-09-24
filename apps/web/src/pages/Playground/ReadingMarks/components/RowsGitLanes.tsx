import { Group, UnstyledButton } from '@mantine/core';
import { CircleIcon } from '@phosphor-icons/react';
import { getChapterReadStatus } from '@/entities/title/readingProgress';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState, PlacedMark } from '../models';
import { getChapterIndex, getChapterMarks, isDimmedApproximate } from '../lib';
import DemoChapterRow from './DemoChapterRow';
import DemoChaptersCard from './DemoChaptersCard';
import GitLane from './GitLane';
import MarksPopover from './MarksPopover';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * E: у каждого источника своя цветная дорожка рядом с линией своего прогресса — как ветки в git.
 * Дорожка тянется от первой главы до той, где остановились на источнике, и кончается его иконкой:
 * иконка одна на источник, а несколько источников на одной главе стоят в соседних дорожках.
 */
function RowsGitLanes({ demo }: Props) {
  const ownIndex = getChapterIndex(demo, demo.own?.chapter);
  // Дорожки в порядке свежести отметок: ближе к своей линии — самая свежая.
  const lanes: PlacedMark[] = demo.placed;

  return (
    <DemoChaptersCard
      demo={demo}
      renderRow={(chapter, index) => {
        const chapterMarks = getChapterMarks(demo, chapter.id).map((item) => item.mark);
        const ownStatus = getChapterReadStatus(index, ownIndex, demo.direction);

        return (
          <DemoChapterRow
            demo={demo}
            chapter={chapter}
            index={index}
            timeline={
              <Group gap={0} wrap="nowrap" align="stretch" flex="none">
                <GitLane
                  demo={demo}
                  status={ownStatus}
                  color="var(--mantine-primary-color-filled)"
                  isMain
                  node={
                    <CircleIcon
                      size={18}
                      weight="fill"
                      color="var(--mantine-primary-color-filled)"
                    />
                  }
                />
                {lanes.map((lane) => {
                  const isApproximate = isDimmedApproximate(demo.approximateStyle, lane.confidence);
                  return (
                    <GitLane
                      key={lane.mark.source.id}
                      demo={demo}
                      status={getChapterReadStatus(
                        index,
                        getChapterIndex(demo, lane.chapter),
                        demo.direction,
                      )}
                      color={lane.mark.source.color}
                      isApproximate={isApproximate}
                      node={
                        <MarksPopover demo={demo} marks={chapterMarks} withContinue>
                          <UnstyledButton
                            display="flex"
                            style={{
                              borderRadius: '50%',
                              boxShadow: `0 0 0 2px ${lane.mark.source.color}`,
                            }}
                          >
                            <SourceIcon
                              id={lane.mark.source.id}
                              title={lane.mark.source.title}
                              size={18}
                              className={isApproximate ? styles.approximate : undefined}
                            />
                          </UnstyledButton>
                        </MarksPopover>
                      }
                    />
                  );
                })}
              </Group>
            }
          />
        );
      }}
    />
  );
}

export default RowsGitLanes;
