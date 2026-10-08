import { Button, Menu, Text } from '@mantine/core';
import { BookmarkSimpleIcon, CaretDownIcon } from '@phosphor-icons/react';
import { getFolderTextColor } from '../lib';
import type { ResolvedFolder } from '../models';
import FolderGlyph from './FolderGlyph';
import FolderMenuItems from './FolderMenuItems';

type Props = {
  folders: ResolvedFolder[];
  folderId: string | null;
  onSelect: (id: string) => void;
  onRemove: () => void;
  defaultOpened?: boolean;
};

/** S3 — кнопка с тем же меню, что в читалке: одно поведение в двух местах. */
function FolderMenuButton({ folders, folderId, onSelect, onRemove, defaultOpened }: Props) {
  const folder = folders.find(({ id }) => id === folderId);

  return (
    <Menu position="bottom-start" withinPortal={false} defaultOpened={defaultOpened} width="target">
      <Menu.Target>
        <Button
          flex={1}
          variant="default"
          justify="space-between"
          leftSection={
            folder ? <FolderGlyph folder={folder} size={14} /> : <BookmarkSimpleIcon size={14} />
          }
          rightSection={<CaretDownIcon size={14} />}
          styles={{ label: { flex: 1, minWidth: 0 } }}
        >
          <Text inherit truncate c={folder ? getFolderTextColor(folder.color) : undefined}>
            {folder ? folder.name : 'В закладки'}
          </Text>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <FolderMenuItems
          folders={folders}
          folderId={folderId}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </Menu.Dropdown>
    </Menu>
  );
}

export default FolderMenuButton;
