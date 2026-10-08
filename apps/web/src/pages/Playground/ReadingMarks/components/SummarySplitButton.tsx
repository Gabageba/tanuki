import { Button, Group, Menu, Stack, Text } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import useDateFormat from '@/shared/hooks/useDateFormat';
import MidDot from '@/shared/ui/MidDot';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoState } from '../models';
import { findPlacedMark, getChapterLabel, getProgressLabel, hasApproximateSymbol } from '../lib';
import OwnContinue from './OwnContinue';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
};

/**
 * S5: «Продолжить | ▾». Под стрелкой — все источники: выбранный переносит свою отметку на его
 * главу и открывает её. Места, которого в ветке нет, выбрать нельзя.
 */
function SummarySplitButton({ demo }: Props) {
  const { formatRelative } = useDateFormat();

  const button = (
    <Group gap={1} wrap="nowrap">
      <Button flex={1} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
        Продолжить <MidDot mx={4} /> {demo.own ? getChapterLabel(demo.own.chapter) : null}
      </Button>
      <Menu position="bottom-end" width={300} withinPortal>
        <Menu.Target>
          <Button px="xs" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <CaretDownIcon />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Продолжить с другого источника</Menu.Label>
          {demo.marks.map((mark) => {
            const placed = findPlacedMark(demo, mark);
            return (
              <Menu.Item
                key={mark.source.id}
                disabled={!placed}
                leftSection={
                  <SourceIcon
                    id={mark.source.id}
                    title={mark.source.title}
                    size={20}
                    className={placed ? undefined : styles.unplaced}
                  />
                }
                rightSection={
                  <Text fz="xs" c="dimmed">
                    {formatRelative(mark.progress.updatedAt)}
                  </Text>
                }
                onClick={() => placed && demo.onGoToChapter(placed.chapter.id)}
              >
                <Stack gap={0}>
                  <Text fz="sm">{mark.source.title}</Text>
                  <Text fz={12} c="dimmed" ff="monospace">
                    {placed
                      ? `${hasApproximateSymbol(demo.approximateStyle, placed.confidence) ? '≈ ' : ''}${getChapterLabel(placed.chapter)}`
                      : getProgressLabel(mark.progress)}
                  </Text>
                </Stack>
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  return <OwnContinue demo={demo} button={button} />;
}

export default SummarySplitButton;
