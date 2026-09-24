import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { READING_MARK_CONFIDENCE } from '@tanuki/contracts';
import { getProgressChapterLabel } from '@/entities/title/readingProgress';
import useDateFormat from '@/shared/hooks/useDateFormat';
import MidDot from '@/shared/ui/MidDot';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { DemoMark, DemoState } from '../models';
import { findPlacedMark, getChapterLabel, hasApproximateSymbol, isDimmedApproximate } from '../lib';
import styles from '../ReadingMarks.module.scss';

type Props = {
  demo: DemoState;
  mark: DemoMark;
  /** Кнопка «к главе» — в сводке; в поповере строки главы она не нужна, глава и так здесь. */
  withGoTo?: boolean;
};

/**
 * Одна отметка: источник, глава в его нумерации, когда, и куда она попала в этой ветке. Если
 * нумерация отличается, видно обе: «Гл. 10 → Т. 2 Гл. 4».
 */
function MarkLine({ demo, mark, withGoTo = false }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();
  const placed = findPlacedMark(demo, mark);
  const sourceLabel = getProgressChapterLabel(mark.progress, t);
  const targetLabel = placed && getChapterLabel(placed.chapter, t);

  return (
    <Group gap={8} wrap="nowrap" align="flex-start">
      <SourceIcon
        id={mark.source.id}
        title={mark.source.title}
        size={20}
        mt={2}
        className={
          !placed
            ? styles.unplaced
            : isDimmedApproximate(demo.approximateStyle, placed.confidence)
              ? styles.approximate
              : undefined
        }
      />
      <Stack gap={0} flex={1} miw={0}>
        <Group gap={6} wrap="nowrap">
          <Text fz="sm" fw={500} truncate="end">
            {mark.source.title}
          </Text>
          <Text fz={12} c="dimmed" flex="none">
            <MidDot /> {formatRelative(mark.progress.updatedAt)}
          </Text>
        </Group>
        <Text fz={12} c="dimmed">
          <Text span inherit ff="monospace">
            {sourceLabel}
          </Text>
          {targetLabel && targetLabel !== sourceLabel && (
            <>
              {' → '}
              <Text span inherit ff="monospace">
                {placed && hasApproximateSymbol(demo.approximateStyle, placed.confidence) && '≈ '}
                {targetLabel}
              </Text>
            </>
          )}
          {targetLabel === sourceLabel &&
            placed &&
            hasApproximateSymbol(demo.approximateStyle, placed.confidence) &&
            ' ≈'}
        </Text>
        {placed && placed.confidence === READING_MARK_CONFIDENCE.APPROXIMATE && (
          <Text fz={11} c="dimmed">
            {t('placeIsApproximate')}
          </Text>
        )}
        {!placed && (
          <Text fz={11} c="dimmed">
            Места в этой ветке не нашлось
          </Text>
        )}
      </Stack>
      {withGoTo && placed && (
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label={targetLabel}
          onClick={() => demo.onGoToChapter(placed.chapter.id)}
        >
          <ArrowRightIcon />
        </ActionIcon>
      )}
    </Group>
  );
}

export default MarkLine;
