import { Button, Divider, Group, Scroller, Stack, Title } from '@mantine/core';
import { Fragment, useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { MATCH_CONFIDENCE, type Manga } from '@tanuki/contracts';
import useMangaMatches from '../../hooks/useMangaMatches';
import MangaMatchCard from './MangaMatchCard';
import MatchConfidenceLabel from './MatchConfidenceLabel';
import useSetMangaLink from '../../hooks/useSetMangaLink';
import MangaMatchAddModal from './MangaMatchAddModal';
import MangaMatchesSkeleton from './MangaMatchesSkeleton';

type Props = {
  manga: Manga;
};

function MangaMatches({ manga }: Props) {
  const { data, isPending: isMatchesPending } = useMangaMatches({ mangaId: manga.id });
  const { mutate: mutateMangaLink, isPending: isMangaLinkPending } = useSetMangaLink({
    mangaId: manga.id,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isMatchesPending) {
    return <MangaMatchesSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return null;
  }

  const groups = Object.values(MATCH_CONFIDENCE)
    .map((confidence) => ({
      confidence,
      matches: data.items.filter((match) => match.confidence === confidence),
    }))
    .filter((group) => group.matches.length > 0);

  return (
    <Stack gap={8}>
      <Group gap={8} justify="space-between">
        <Title order={5}>Найдено на других источниках</Title>
        <Button
          size="xs"
          variant="default"
          leftSection={<PlusIcon />}
          loading={isMangaLinkPending}
          onClick={() => setIsAddModalOpen(true)}
        >
          Добавить вручную
        </Button>
      </Group>

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
      <MangaMatchAddModal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mutateMangaLink={mutateMangaLink}
        isMangaLinkPending={isMangaLinkPending}
      />
    </Stack>
  );
}

export default MangaMatches;
