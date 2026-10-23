import { Text } from '@mantine/core';
import { countFresh, getFreshText } from '../lib';
import type { SiteFolder } from '../models';

type Props = {
  folder: SiteFolder;
};

/** Сколько тайтлов ляжет из папки: число — колонкой моноширинным, «Нового нет» — словами. */
function FolderCount({ folder }: Props) {
  const isEmpty = countFresh(folder) === 0;

  return (
    <Text
      ff={isEmpty ? undefined : 'monospace'}
      fz={12}
      c="dimmed"
      style={{ whiteSpace: 'nowrap' }}
    >
      {getFreshText(folder)}
    </Text>
  );
}

export default FolderCount;
