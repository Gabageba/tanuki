import { useState } from 'react';
import { Card, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SORT_DIRECTION, type Chapter } from '@tanuki/contracts';
import { TIMELINE_ZONE, type DemoState, type TimelineZone } from '../models';
import {
  formatChapterCount,
  getChapterLabel,
  getChapterMarks,
  getCompactApproximateStyle,
  getTimelineZone,
  toStackItems,
} from '../lib';
import DemoChapterRow from './DemoChapterRow';
import MarksPopover from './MarksPopover';
import SourceStack from './SourceStack';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/** Своя текущая глава — в разделе прочитанного, отдельного раздела у неё нет. */
const toSectionZone = (zone: TimelineZone) =>
  zone === TIMELINE_ZONE.CURRENT ? TIMELINE_ZONE.READ : zone;

type Section = {
  zone: TimelineZone;
  chapters: { chapter: Chapter; index: number }[];
};

/**
 * O: вместо линии список делится на разделы с заголовками: «Не прочитано», «Прочитано на
 * Inkstory, MangaLib» и «Прочитано здесь» — последний свёрнут. Где кто остановился, видно по
 * заголовку раздела; иконки в строках — только на главах, где остановились.
 */
function RowsSections({ demo }: Props) {
  const { t } = useTranslation();
  const [openedZones, setOpenedZones] = useState<TimelineZone[]>([
    TIMELINE_ZONE.UNREAD,
    TIMELINE_ZONE.ELSEWHERE,
  ]);

  const sections = demo.chapters.reduce<Section[]>((result, chapter, index) => {
    const zone = toSectionZone(getTimelineZone(demo, index));
    const last = result.at(-1);
    if (last?.zone === zone) last.chapters.push({ chapter, index });
    else result.push({ zone, chapters: [{ chapter, index }] });
    return result;
  }, []);

  const toggle = (zone: TimelineZone) =>
    setOpenedZones((zones) =>
      zones.includes(zone) ? zones.filter((item) => item !== zone) : [...zones, zone],
    );

  const renderHeader = ({ zone, chapters }: Section) => {
    const marks = chapters.flatMap(({ chapter }) => getChapterMarks(demo, chapter.id));
    const isDesc = demo.direction === SORT_DIRECTION.DESC;
    const first = (isDesc ? chapters.at(-1) : chapters[0])?.chapter;
    const last = (isDesc ? chapters[0] : chapters.at(-1))?.chapter;
    const range =
      first && last && first !== last
        ? `${getChapterLabel(first, t)} – ${getChapterLabel(last, t)}`
        : first && getChapterLabel(first, t);

    const title = (() => {
      switch (zone) {
        case TIMELINE_ZONE.UNREAD:
          return 'Не прочитано';
        case TIMELINE_ZONE.ELSEWHERE:
          return `Прочитано на ${[...new Set(marks.map((item) => item.mark.source.title))].join(', ')}`;
        case TIMELINE_ZONE.READ:
        case TIMELINE_ZONE.CURRENT:
          return 'Прочитано здесь';
      }
    })();

    return (
      <UnstyledButton className={styles.sectionHeader} onClick={() => toggle(zone)}>
        <Group gap={8} wrap="nowrap">
          <CaretDownIcon
            size={14}
            className={styles.sectionCaret}
            data-collapsed={!openedZones.includes(zone) || undefined}
          />
          {zone === TIMELINE_ZONE.ELSEWHERE && (
            <SourceStack
              items={toStackItems(marks)}
              approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
              size={16}
              max={3}
            />
          )}
          <Text fz="sm" fw={600} flex={1} miw={0} truncate="end">
            {title}
          </Text>
          <Text fz={12} c="dimmed" flex="none">
            {formatChapterCount(chapters.length)}
          </Text>
          <Text fz={12} c="dimmed" ff="monospace" flex="none" visibleFrom="xs">
            {range}
          </Text>
        </Group>
      </UnstyledButton>
    );
  };

  return (
    <Card withBorder p={0} bg="transparent">
      {sections.map((section) => (
        <div key={section.zone}>
          {renderHeader(section)}
          <Collapse expanded={openedZones.includes(section.zone)}>
            {section.chapters.map(({ chapter, index }) => {
              const marks = getChapterMarks(demo, chapter.id);
              return (
                <DemoChapterRow
                  key={chapter.id}
                  demo={demo}
                  chapter={chapter}
                  index={index}
                  timeline={false}
                  trailing={
                    <>
                      {demo.own?.chapter.id === chapter.id && (
                        <Text fz={12} c="var(--mantine-primary-color-filled)" flex="none">
                          вы здесь
                        </Text>
                      )}
                      {marks.length > 0 && (
                        <MarksPopover
                          demo={demo}
                          marks={marks.map((item) => item.mark)}
                          withContinue
                        >
                          <UnstyledButton flex="none">
                            <SourceStack
                              items={toStackItems(marks)}
                              approximateStyle={getCompactApproximateStyle(demo.approximateStyle)}
                              size={16}
                              max={3}
                            />
                          </UnstyledButton>
                        </MarksPopover>
                      )}
                    </>
                  }
                />
              );
            })}
          </Collapse>
        </div>
      ))}
    </Card>
  );
}

export default RowsSections;
