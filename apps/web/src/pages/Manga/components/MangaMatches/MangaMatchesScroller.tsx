import { Divider, EmptyState, Group, Scroller, Stack } from '@mantine/core';
import { Fragment } from 'react/jsx-runtime';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { MangaMatch } from '@tanuki/contracts';
import { MATCH_CONFIDENCE } from '@tanuki/contracts';
import MatchConfidenceLabel from './MatchConfidenceLabel';
import MangaMatchCard from './MangaMatchCard';
import type useSetMangaLink from '../../hooks/useSetMangaLink';

type Props = {
  matches: MangaMatch[] | undefined;
  mutateMangaLink: ReturnType<typeof useSetMangaLink>['mutate'];
  isMangaLinkPending: boolean;
};

function MangaMatchesScroller({ matches, mutateMangaLink, isMangaLinkPending }: Props) {
  const { t } = useTranslation();

  if (!matches?.length) {
    return (
      <EmptyState description={t('algorithmFoundNoSimilarTitles')} size="sm" icon={<EmptyIcon />} />
    );
  }
  const groups = Object.values(MATCH_CONFIDENCE)
    .map((confidence) => ({
      confidence,
      matches: matches.filter((match) => match.confidence === confidence),
    }))
    .filter((group) => group.matches.length > 0);

  return (
    <Scroller flex={1} styles={{ control: { zIndex: 2 } }}>
      <Group wrap="nowrap" align="stretch" gap="xs">
        {groups.map(({ confidence, matches }, index) => (
          <Fragment key={confidence}>
            <Stack gap={6}>
              <Group wrap="nowrap" gap="xs">
                {index > 0 && <Divider orientation="vertical" style={{ visibility: 'hidden' }} />}
                <MatchConfidenceLabel confidence={confidence} matchesCount={matches.length} />
              </Group>
              <Group wrap="nowrap" h="100%" align="stretch" gap="xs">
                {index > 0 && <Divider orientation="vertical" />}
                {matches.map((match) => (
                  <MangaMatchCard
                    key={match.manga.id}
                    match={match}
                    mutateMangaLink={mutateMangaLink}
                    isMangaLinkPending={isMangaLinkPending}
                  />
                ))}
              </Group>
            </Stack>
          </Fragment>
        ))}
      </Group>
    </Scroller>
  );
}

export default MangaMatchesScroller;
