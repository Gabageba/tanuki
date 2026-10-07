import { Group, Text } from '@mantine/core';
import { resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import type { BuiltInStyle } from '../models';
import FolderGlyph from './FolderGlyph';

type Props = {
  style: BuiltInStyle;
};

/** Все папки крупно: встроенные и две свои. */
function FolderList({ style }: Props) {
  return (
    <Group gap="lg">
      {MOCK_FOLDERS.map((folder) => {
        const resolved = resolveFolder(folder, style);

        return (
          <Group key={folder.id} gap={6} wrap="nowrap">
            <FolderGlyph folder={resolved} size={20} />
            <Text fz="sm" truncate maw={180}>
              {resolved.name}
            </Text>
          </Group>
        );
      })}
    </Group>
  );
}

export default FolderList;
