import { Group, Text } from '@mantine/core';
import { catalogEntryFor, VIEW_MODE, type SourceId, type Title } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
import SourceTitleMeta from '@/entities/source/components/SourceTitleCard/components/SourceTitleMeta';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';
import styles from './QuickMatchRow.module.scss';

type Props = {
  title: Title;
  index: number;
  review: ReturnType<typeof useComparison>;
  isStaff: boolean;
};

function QuickMatchRow({ title, index, review, isStaff }: Props) {
  const sourceTitle = catalogEntryFor(title.sourceId as SourceId).title;

  return (
    <TitleCard
      viewMode={VIEW_MODE.LIST}
      listSize={TITLE_CARD_LIST_SIZE.COMPACT}
      data={{ ...title, description: null }}
      meta={<SourceTitleMeta title={title} />}
      footer={
        <Group justify="space-between" gap="xs">
          <Group gap={4} wrap="nowrap" miw={0}>
            <SourceIcon id={title.sourceId} title={sourceTitle} size={20} />
            <Text fz="xs" c="dimmed">
              {sourceTitle}
            </Text>
          </Group>
          {isStaff && (
            <Group className={styles.actions} pos="relative" gap={0}>
              <QuickDecisionButtons review={review} index={index} />
            </Group>
          )}
        </Group>
      }
    />
  );
}

export default QuickMatchRow;
