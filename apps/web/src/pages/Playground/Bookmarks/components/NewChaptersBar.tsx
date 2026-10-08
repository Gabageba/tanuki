import { Box, Group, Tooltip } from '@mantine/core';
import { NEUTRAL_BAR_COLOR } from '@/shared/lib/palette';
import { getNewChaptersPhrase } from '../lib';
import type { MockBookmark } from '../models';

type Props = {
  bookmark: Pick<MockBookmark, 'progress' | 'chaptersCount' | 'newChaptersCount'>;
};

/** Хвост новых глав не тоньше этой доли — иначе 3 главы из 1093 не видно. */
const MIN_NEW_SHARE = 0.08;

/**
 * C6 — тонкая полоса под обложкой: прочитанное нейтральным, непрочитанные старые — фоном,
 * новые главы — акцентным хвостом в конце. Число — только в подсказке.
 */
function NewChaptersBar({ bookmark }: Props) {
  const total = bookmark.progress?.total ?? bookmark.chaptersCount ?? 0;

  if (!total) return <Box h={3} />;

  const newCount = Math.min(bookmark.newChaptersCount, total);
  const newShare = newCount > 0 ? Math.max(newCount / total, MIN_NEW_SHARE) : 0;
  // Прочитанное ужимается, чтобы хвост новых влез при любой длине тайтла.
  const readShare = Math.min((bookmark.progress?.chapter ?? 0) / total, 1 - newShare);
  const restShare = Math.max(1 - readShare - newShare, 0);

  const bar = (
    <Group
      gap={0}
      wrap="nowrap"
      h={3}
      bdrs="xl"
      bg="var(--tanuki-color-border-subtle)"
      style={{ overflow: 'hidden' }}
    >
      <Box h="100%" w={`${readShare * 100}%`} bg={NEUTRAL_BAR_COLOR} />
      <Box h="100%" w={`${restShare * 100}%`} />
      {newShare > 0 && (
        <Box h="100%" w={`${newShare * 100}%`} bg="var(--mantine-primary-color-filled)" />
      )}
    </Group>
  );

  if (newCount === 0) return bar;

  return (
    <Tooltip label={getNewChaptersPhrase(bookmark.newChaptersCount)} position="bottom">
      {bar}
    </Tooltip>
  );
}

export default NewChaptersBar;
