import { Fragment, type ReactNode } from 'react';
import { Button, Divider, Group, Scroller, Stack } from '@mantine/core';
import { GitDiffIcon } from '@phosphor-icons/react';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { getVisibleMatchGroups } from '../lib';
import type useComparison from '../hooks/useComparison';
import CurrentMatchCard from './CurrentMatchCard';
import MatchGroupHeading from './MatchGroupHeading';
import MatchesEmptyState from './MatchesEmptyState';

type Props = {
  review: ReturnType<typeof useComparison>;
  isCurrent: boolean;
  isStaff: boolean;
  isEmpty: boolean;
  actions?: (index: number) => ReactNode;
  card?: (index: number) => ReactNode;
  cardWidth?: number;
};

function MatchesRail({
  review,
  isCurrent,
  isStaff,
  isEmpty,
  actions,
  card,
  cardWidth = 170,
}: Props) {
  const isPending = review.pendingVerdict !== null;
  const groups = isEmpty ? [] : getVisibleMatchGroups(review.verdicts);

  if (groups.length === 0) return <MatchesEmptyState />;

  return (
    <Scroller flex={1} styles={{ control: { zIndex: 2 } }}>
      <Group wrap="nowrap" align="stretch" gap="xs">
        {groups.map(({ confidence, matches: groupMatches }, groupIndex) => (
          <Fragment key={confidence}>
            <Stack gap={6}>
              <Group wrap="nowrap" gap="xs">
                {groupIndex > 0 && (
                  <Divider orientation="vertical" style={{ visibility: 'hidden' }} />
                )}
                <MatchGroupHeading confidence={confidence} count={groupMatches.length} />
              </Group>
              <Group wrap="nowrap" h="100%" align="stretch" gap="xs">
                {groupIndex > 0 && <Divider orientation="vertical" />}
                {groupMatches.map(({ index, ...match }) => (
                  <Stack
                    key={match.title.id}
                    w={cardWidth}
                    gap={8}
                    justify="space-between"
                    flex="none"
                  >
                    {card ? (
                      card(index)
                    ) : isCurrent && isStaff ? (
                      <CurrentMatchCard
                        match={match}
                        isPending={isPending}
                        onSave={(verdict, onSaved) => review.save(verdict, index, onSaved)}
                      />
                    ) : (
                      <SourceTitleCard title={match.title} showSource />
                    )}
                    {actions
                      ? actions(index)
                      : !isCurrent &&
                        isStaff && (
                          <Button
                            size="xs"
                            fullWidth
                            variant={
                              review.opened && review.selectedIndex === index ? 'light' : 'default'
                            }
                            leftSection={<GitDiffIcon size={20} />}
                            aria-label={`Сравнить «${match.title.name}»`}
                            disabled={isPending}
                            onClick={() => review.select(index)}
                          >
                            Сравнить
                          </Button>
                        )}
                  </Stack>
                ))}
              </Group>
            </Stack>
          </Fragment>
        ))}
      </Group>
    </Scroller>
  );
}

export default MatchesRail;
