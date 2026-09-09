import type { MouseEvent } from 'react';
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { MANGA_LINK_VERDICT, MATCH_CONFIDENCE, type MangaLinkVerdict } from '@tanuki/contracts';
import type { MangaMatch } from '@tanuki/contracts';
import NavigateToMangaCard from '@/entities/manga/NavigateToMangaCard';
import SourceIcon from '@/entities/source/components/SourceIcon';
import Mdash from '@/shared/ui/Mdash';
import MidDot from '@/shared/ui/MidDot';
import { getMatchConfidenceColor, getMatchConfidenceLabel } from './lib';

type Props = {
  match: MangaMatch;
  sourceTitle: string;
  onSetVerdict: (targetId: string, verdict: MangaLinkVerdict) => void;
  isSaving: boolean;
};

function MangaMatchRow({ match, sourceTitle, onSetVerdict, isSaving }: Props) {
  const { manga } = match;
  const meta = [manga.year, manga.chaptersCount ? `${manga.chaptersCount} гл.` : null].filter(
    Boolean,
  );
  const isConfirmed = match.confidence === MATCH_CONFIDENCE.CONFIRMED;

  // Строка целиком — ссылка на тайтл, поэтому клик по кнопке правки не должен по ней уводить.
  const handleVerdict = (verdict: MangaLinkVerdict) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSetVerdict(manga.id, verdict);
  };

  return (
    <NavigateToMangaCard manga={manga} p="xs" withBorder radius="md">
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <SourceIcon id={manga.sourceId} title={sourceTitle} size={24} bdrs="sm" />
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" justify="space-between">
            <Text fz={14} fw={500} truncate>
              {sourceTitle}
            </Text>
            <Group gap={4} wrap="nowrap">
              <Badge color={getMatchConfidenceColor(match.confidence)} variant="light" size="xs">
                {getMatchConfidenceLabel(match.confidence)}
              </Badge>
              <Tooltip label={isConfirmed ? 'Снять пометку' : 'Это тот же тайтл'}>
                <ActionIcon
                  size="sm"
                  variant={isConfirmed ? 'light' : 'subtle'}
                  color={isConfirmed ? getMatchConfidenceColor(match.confidence) : 'gray'}
                  disabled={isSaving}
                  onClick={handleVerdict(
                    isConfirmed ? MANGA_LINK_VERDICT.NONE : MANGA_LINK_VERDICT.CONFIRMED,
                  )}
                >
                  <CheckIcon size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Это другой тайтл">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  disabled={isSaving}
                  onClick={handleVerdict(MANGA_LINK_VERDICT.REJECTED)}
                >
                  <XIcon size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Название нужно всегда, когда с источника пришло несколько вариантов: выбрать
              между ними можно только по нему. */}
          {(match.tied || match.matchedTitle !== manga.title) && (
            <Text fz={12} c="dimmed" truncate>
              {manga.title}
            </Text>
          )}

          <Text fz={12} c="dimmed" ff="monospace">
            {meta.length > 0 ? (
              meta.map((item, index) => (
                <span key={item}>
                  {index > 0 && <MidDot />}
                  {item}
                </span>
              ))
            ) : (
              <Mdash />
            )}
          </Text>
        </Stack>
      </Group>
    </NavigateToMangaCard>
  );
}

export default MangaMatchRow;
