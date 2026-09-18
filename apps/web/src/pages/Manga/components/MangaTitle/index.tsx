import { Badge, Group, Stack, Title } from '@mantine/core';
import MangaBreadcrumbs from '../MangaBreadcrumbs';
import type { Manga } from '@tanuki/contracts';
import { SOURCE_LOCALE } from '@tanuki/contracts';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import MangaContentRating from '../MangaContentRating';
import useSource from '@/entities/source/hooks/useSource';
import { getFlagByLocale } from '@/entities/source/lib';

type Props = {
  manga: Manga;
};

function MangaTitle({ manga }: Props) {
  const { data: source } = useSource({ sourceId: manga.sourceId });

  return (
    <Stack gap="sm">
      <MangaBreadcrumbs manga={manga} />
      <Stack gap={8}>
        <Group justify="space-between" gap={8} wrap="nowrap" align="flex-start">
          <Title lh={1} size={30} style={{ flex: 1, minWidth: 0 }}>
            {manga.title}
          </Title>
          <Group gap={8} wrap="nowrap">
            {source && source.locale !== SOURCE_LOCALE.RU ? (
              <Badge color="gray" variant="light" ff="monospace">
                {getFlagByLocale(source.locale)} {source.locale.toUpperCase()}
              </Badge>
            ) : null}
            <MangaContentRating contentRating={manga.contentRating} />
          </Group>
        </Group>

        <MidDotGroup
          gap={8}
          maxRows={1}
          separatorProps={{ c: 'dimmed', lh: 1 }}
          text={{
            lh: 1,
            c: 'dimmed',
          }}
          items={[...manga.originalTitle, ...manga.altTitles]}
        />
      </Stack>
    </Stack>
  );
}

export default MangaTitle;
