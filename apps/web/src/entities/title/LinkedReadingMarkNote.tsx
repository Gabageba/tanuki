import { Group, Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import type { ReadingProgress } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import SourceIcon from '@/entities/source/components/SourceIcon';
import useSource from '@/entities/source/hooks/useSource';
import { getProgressChapterLabel } from './readingProgress';
import MidDotGroup from '@/shared/ui/MidDotGroup';

type Props = {
  progress: ReadingProgress;
  hideIcon?: boolean;
};

function LinkedReadingMarkNote({ progress, hideIcon }: Props) {
  const { t } = useTranslation();
  const { formatRelative } = useDateFormat();
  const { data: source } = useSource({ sourceId: progress.sourceId });
  const sourceTitle = source?.title ?? progress.sourceId;

  return (
    <Group gap={6} wrap="nowrap" miw={0}>
      {!hideIcon && <SourceIcon id={progress.sourceId} title={sourceTitle} size={16} radius="sm" />}
      <MidDotGroup
        items={[
          // A span keeps the Trans pieces one inline run — MidDotGroup's inline-flex wrapper
          // would otherwise make each a flex item and collapse the space after the name.
          <span key="source">
            <Trans
              i18nKey="onSourceChapter"
              values={{ source: sourceTitle, chapter: getProgressChapterLabel(progress, t) }}
              components={{
                name: <Text span inherit fw={600} c="var(--mantine-color-text)" fz={12} />,
              }}
            />
          </span>,
          formatRelative(progress.updatedAt),
        ]}
        text={{ fz: 12, c: 'dimmed' }}
        truncate
      />
    </Group>
  );
}

export default LinkedReadingMarkNote;
