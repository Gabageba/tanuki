import { Button, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { type Manga } from '@tanuki/contracts';
import useMangaMatches from '../../hooks/useMangaMatches';
import useSetMangaLink from '../../hooks/useSetMangaLink';
import MangaMatchesSkeleton from './MangaMatchesSkeleton';
import MangaMatchesScroller from './MangaMatchesScroller';
import MangaMatchAddModal from './MangaMatchAddModal';

type Props = {
  manga: Manga;
};

function MangaMatches({ manga }: Props) {
  const { t } = useTranslation();
  const { data, isPending: isMatchesPending } = useMangaMatches({ mangaId: manga.id });
  const { mutate: mutateMangaLink, isPending: isMangaLinkPending } = useSetMangaLink({
    mangaId: manga.id,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isMatchesPending) {
    return <MangaMatchesSkeleton />;
  }

  return (
    <Stack gap={8}>
      <Group gap={8} justify="space-between">
        <Title order={5}>{t('foundOnOtherSources')}</Title>
        <Button
          size="xs"
          variant="default"
          leftSection={<PlusIcon />}
          loading={isMangaLinkPending}
          onClick={() => setIsAddModalOpen(true)}
        >
          {t('addManually')}
        </Button>
      </Group>

      <MangaMatchesScroller
        matches={data?.items}
        mutateMangaLink={mutateMangaLink}
        isMangaLinkPending={isMangaLinkPending}
      />
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
