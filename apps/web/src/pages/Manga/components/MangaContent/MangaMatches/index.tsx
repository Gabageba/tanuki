import { useState } from 'react';
import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';
import type { Manga, MangaLinkVerdict } from '@tanuki/contracts';
import useSources from '@/entities/source/hooks/useSources';
import { flattenSources } from '@/entities/source/lib';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import useMangaMatches from '../../../hooks/useMangaMatches';
import useSetMangaLink from '../../../hooks/useSetMangaLink';
import MangaMatchAddModal from './MangaMatchAddModal';
import MangaMatchRow from './MangaMatchRow';
import MangaMatchesSkeleton from './MangaMatchesSkeleton';
import { isConfidentMatch } from './lib';

type Props = {
  manga: Manga;
};

function MangaMatches({ manga }: Props) {
  const [showUncertain, setShowUncertain] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);

  // Тот же приём, что в NavigateToMangaCard: id хранится как «sourceId:opaqueId».
  const mangaId = manga.id.slice(manga.sourceId.length + 1);
  const { data, isPending, error } = useMangaMatches({ sourceId: manga.sourceId, mangaId });
  const setLink = useSetMangaLink({ sourceId: manga.sourceId, mangaId });

  const handleVerdict = (targetId: string, verdict: MangaLinkVerdict) =>
    setLink.mutate({ targetId, verdict });
  const { data: sourcesData } = useSources();

  const sourceTitle = (sourceId: string) =>
    flattenSources(sourcesData).find((source) => source.id === sourceId)?.title ?? sourceId;

  const confident = data?.items.filter((match) => isConfidentMatch(match.confidence)) ?? [];
  const uncertain = data?.items.filter((match) => !isConfidentMatch(match.confidence)) ?? [];

  return (
    <Stack gap={8}>
      <Title order={5}>Читать на других сайтах</Title>

      {isPending && <MangaMatchesSkeleton />}
      {error && <ApiErrorText error={error} />}

      {data && data.items.length === 0 && (
        <Text c="dimmed" fz={14}>
          Не нашли этот тайтл на других сайтах
        </Text>
      )}

      {confident.length > 0 && (
        <Stack gap={6}>
          {confident.map((match) => (
            <MangaMatchRow
              key={match.manga.id}
              match={match}
              sourceTitle={sourceTitle(match.manga.sourceId)}
              onSetVerdict={handleVerdict}
              isSaving={setLink.isPending}
            />
          ))}
        </Stack>
      )}

      {/* Спорных всегда заметно больше, чем уверенных: русские названия у источников свои, и
          нечёткие совпадения по ним идут потоком. Прячем их под кат, но не выбрасываем —
          именно там оказываются тайтлы, у которых совпал только перевод названия. */}
      {uncertain.length > 0 && (
        <Stack gap={6}>
          {showUncertain &&
            uncertain.map((match) => (
              <MangaMatchRow
                key={match.manga.id}
                match={match}
                sourceTitle={sourceTitle(match.manga.sourceId)}
                onSetVerdict={handleVerdict}
                isSaving={setLink.isPending}
              />
            ))}
          <Anchor
            component="button"
            type="button"
            fz={14}
            fw={500}
            w="fit-content"
            onClick={() => setShowUncertain((shown) => !shown)}
          >
            {showUncertain
              ? 'Скрыть неточные совпадения'
              : `Показать неточные совпадения (${uncertain.length})`}
          </Anchor>
        </Stack>
      )}

      <Group gap="sm" justify="space-between">
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<PlusIcon size={14} />}
          onClick={() => setAddOpen(true)}
        >
          Добавить вручную
        </Button>

        {data && data.failures.length > 0 && (
          <Text c="dimmed" fz={12}>
            <Text span ff="monospace" inherit>
              {data.failures.length}
            </Text>{' '}
            {data.failures.length === 1 ? 'источник не ответил' : 'источников не ответили'}
          </Text>
        )}
      </Group>

      <MangaMatchAddModal
        opened={isAddOpen}
        isSaving={setLink.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={handleVerdict}
      />
    </Stack>
  );
}

export default MangaMatches;
