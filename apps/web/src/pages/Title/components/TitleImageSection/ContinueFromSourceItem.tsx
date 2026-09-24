import { Menu, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  READING_MARK_CONFIDENCE,
  type ChapterNumbering,
  type LinkedReadingProgress,
} from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import SourceIcon from '@/entities/source/components/SourceIcon';
import useSource from '@/entities/source/hooks/useSource';
import type { ReadingMark } from '@/entities/title/models';
import {
  getChapterLabel,
  getProgressChapterLabel,
  getReaderPath,
} from '@/entities/title/readingProgress';
import styles from './TitleReadingActions.module.scss';

type Props = {
  titleId: string;
  progress: LinkedReadingProgress;
  /** Как нумерует главы ветка «Продолжить» — в ней показывается глава отметки. */
  numbering: ChapterNumbering;
  /** Место отметки в ветке «Продолжить»; undefined — не нашлось, выбрать нельзя. */
  mark: ReadingMark | undefined;
};

/**
 * Источник в меню «Продолжить»: открывает главу, на которую перенесена его отметка, — читалка
 * сама переставит туда и свою. Место не нашлось — видна глава в нумерации источника.
 */
function ContinueFromSourceItem({ titleId, progress, numbering, mark }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();
  const { data: source } = useSource({ sourceId: progress.sourceId });
  const sourceTitle = source?.title ?? progress.sourceId;

  const sections = {
    leftSection: (
      <SourceIcon
        id={progress.sourceId}
        title={sourceTitle}
        size={20}
        data-approximate={mark?.confidence === READING_MARK_CONFIDENCE.APPROXIMATE || undefined}
        data-unplaced={!mark || undefined}
        className={styles.sourceIcon}
        radius="sm"
      />
    ),
    rightSection: (
      <Text fz={12} c="dimmed">
        {formatRelative(progress.updatedAt)}
      </Text>
    ),
  };
  const content = (
    <Stack gap={0}>
      <Text fz="sm">{sourceTitle}</Text>
      <Text fz={12} c="dimmed" ff="monospace">
        {mark ? getChapterLabel(mark.chapter, numbering, t) : getProgressChapterLabel(progress, t)}
      </Text>
    </Stack>
  );

  if (!mark) {
    return (
      <Menu.Item disabled {...sections}>
        {content}
      </Menu.Item>
    );
  }

  return (
    <Menu.Item component={Link} to={getReaderPath(titleId, mark.chapter.id)} {...sections}>
      {content}
    </Menu.Item>
  );
}

export default ContinueFromSourceItem;
