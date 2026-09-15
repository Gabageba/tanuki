import { Group, Stack, Title } from '@mantine/core';
import MangaBreadcrumbs from '../MangaBreadcrumbs';
import type { Manga } from '@tanuki/contracts';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import MangaContentRating from '../MangaContentRating';

type Props = {
  manga: Manga;
};

function MangaTitle({ manga }: Props) {
  return (
    <Stack gap="sm">
      <MangaBreadcrumbs manga={manga} />
      <Stack gap={8}>
        <Group justify="space-between" gap={8}>
          <Title lh={1} size={30}>
            {manga.title}
          </Title>
          <MangaContentRating contentRating={manga.contentRating} />
        </Group>

        <MidDotGroup
          gap={8}
          separatorProps={{ c: 'dimmed', lh: 1 }}
          text={{
            lh: 1,
            c: 'dimmed',
          }}
          items={[manga.originalTitle, ...(manga.altTitles || [])].filter(Boolean)}
        />
      </Stack>
    </Stack>
  );
}

export default MangaTitle;
