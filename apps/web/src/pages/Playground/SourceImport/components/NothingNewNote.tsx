import { Stack, Text } from '@mantine/core';
import { isImported } from '../lib';
import { SOURCE_TITLE, type SiteFolder } from '../models';

type Props = {
  folders: SiteFolder[];
};

/** «Нового нет» — повторный импорт, где всё уже в закладках. Как `NothingNewNote` копии. */
function NothingNewNote({ folders }: Props) {
  const items = folders.flatMap((folder) => folder.items);

  if (items.length === 0 || !items.every(isImported)) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Text lh="tight" fz="sm">
        Нового нет — всё с {SOURCE_TITLE} уже в закладках.
      </Text>
      <Text lh="tight" c="dimmed" fz={13}>
        Отметьте тайтлы, если хотите обновить у них «где остановился».
      </Text>
    </Stack>
  );
}

export default NothingNewNote;
