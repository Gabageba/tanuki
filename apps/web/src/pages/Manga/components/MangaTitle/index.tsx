import { Group, Stack, Text, Title } from '@mantine/core';
import MangaBreadcrumbs from '../MangaBreadcrumbs';
import type { Manga } from '@tanuki/contracts';
import MidDot from '@/shared/ui/MidDot';

type Props = {
  manga: Manga;
};

function MangaTitle({ manga }: Props) {
  return (
    <Stack gap="sm">
      <MangaBreadcrumbs manga={manga} />
      <Stack gap={8}>
        <Title lh={1} size={30}>
          {manga.title}
        </Title>
        <Group gap={8}>
          {manga.altTitles.map((altTitle, index) => (
            <>
              {index > 0 && (
                <Text c="dimmed" lh={1}>
                  <MidDot />
                </Text>
              )}
              <Text c="dimmed" lh={1}>
                {altTitle}
              </Text>
            </>
          ))}
        </Group>
      </Stack>
    </Stack>
  );
}

export default MangaTitle;
