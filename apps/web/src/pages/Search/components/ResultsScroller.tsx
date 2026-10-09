import { Box, Group, Scroller } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCard from '@/entities/title/card/TitleCard';

type Props = {
  items: Title[];
  getBookmarkFolder: (titleId: string) => ResolvedBookmarkFolder | null;
};

/** Лента обложек: у краёв стрелки с затуханием, мышью её можно тянуть, на телефоне — пальцем. */
function ResultsScroller({ items, getBookmarkFolder }: Props) {
  return (
    <Scroller>
      <Group gap="md" wrap="nowrap" align="flex-start">
        {items.map((title) => (
          <Box key={title.id} w={{ base: 128, sm: 168 }} flex="none">
            <TitleCard title={title} bookmarkFolder={getBookmarkFolder(title.id)} />
          </Box>
        ))}
      </Group>
    </Scroller>
  );
}

export default ResultsScroller;
