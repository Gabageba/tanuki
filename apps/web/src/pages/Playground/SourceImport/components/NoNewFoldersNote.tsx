import { Text } from '@mantine/core';
import { countFresh } from '../lib';
import { SOURCE_TITLE, type SiteFolder } from '../models';

type Props = {
  folders: SiteFolder[];
};

/** «Нового нет» над папками — повторный импорт, где всё уже в закладках. */
function NoNewFoldersNote({ folders }: Props) {
  if (folders.length === 0 || folders.some((folder) => countFresh(folder) > 0)) {
    return null;
  }

  return (
    <Text lh="tight" fz="sm">
      Нового нет — всё с {SOURCE_TITLE} уже в закладках.
    </Text>
  );
}

export default NoNewFoldersNote;
