import { EmptyState } from '@mantine/core';
import { TagIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { TagStatistic } from '@tanuki/contracts';
import ProfileStatisticCard from './ProfileStatisticCard';
import ProgressList from '@/shared/ui/ProgressList';

type Props = {
  tags: TagStatistic[];
};

function TagsCard({ tags }: Props) {
  const { t } = useTranslation();

  return (
    <ProfileStatisticCard label={t('tags')} extra={t('byChaptersRead')}>
      {tags.length > 0 ? (
        <ProgressList
          gap="sm"
          items={tags.map(({ name, chapters }) => ({
            key: name,
            label: name,
            value: chapters,
            text: t('countChaptersAbbrev', { count: chapters }),
          }))}
          highlightedIndex={0}
        />
      ) : (
        <EmptyState
          title={t('noDataYet')}
          description={t('tagsOfTitlesYouReadWillAppearHere')}
          icon={<TagIcon />}
        />
      )}
    </ProfileStatisticCard>
  );
}

export default TagsCard;
