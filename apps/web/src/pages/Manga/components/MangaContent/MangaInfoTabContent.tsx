import { Stack, Title } from '@mantine/core';
import CollapsibleGroup from '@/shared/ui/CollapsibleGroup';
import CollapsibleText from '@/shared/ui/CollapsibleText';
import TagBadge from '@/shared/ui/TagBadge';
import type { Manga } from '@tanuki/contracts';
import MangaMatches from './MangaMatches';

type Props = {
  manga: Manga;
};

function MangaInfoTabContent({ manga }: Props) {
  return (
    <Stack gap="md">
      <Stack gap={8}>
        <Title order={5}>Описание</Title>
        <CollapsibleText lineClamp={3}>{manga.description}</CollapsibleText>
      </Stack>
      <Stack gap={8}>
        <Title order={5}>Теги</Title>
        <CollapsibleGroup gap={6} maxRows={2}>
          {manga.tags.map((tag) => (
            <TagBadge key={tag.id}>{tag.title}</TagBadge>
          ))}
        </CollapsibleGroup>
      </Stack>
      <MangaMatches manga={manga} />
    </Stack>
  );
}

export default MangaInfoTabContent;
