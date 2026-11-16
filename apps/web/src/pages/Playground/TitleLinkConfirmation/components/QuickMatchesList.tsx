import { Stack } from '@mantine/core';
import { getVisibleMatchGroups } from '../lib';
import type useComparison from '../hooks/useComparison';
import MatchGroupHeading from './MatchGroupHeading';
import MatchesEmptyState from './MatchesEmptyState';
import QuickMatchRow from './QuickMatchRow';

type Props = {
  review: ReturnType<typeof useComparison>;
  isStaff: boolean;
  isEmpty: boolean;
};

function QuickMatchesList({ review, isStaff, isEmpty }: Props) {
  const groups = isEmpty ? [] : getVisibleMatchGroups(review.verdicts);

  if (groups.length === 0) return <MatchesEmptyState />;

  return (
    <Stack gap="md">
      {groups.map(({ confidence, matches }) => (
        <Stack key={confidence} gap={8}>
          <MatchGroupHeading confidence={confidence} count={matches.length} />
          {matches.map(({ title, index }) => (
            <QuickMatchRow
              key={title.id}
              title={title}
              index={index}
              review={review}
              isStaff={isStaff}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

export default QuickMatchesList;
