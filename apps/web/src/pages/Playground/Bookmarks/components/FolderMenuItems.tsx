import { Menu } from '@mantine/core';
import { CheckIcon, TrashIcon } from '@phosphor-icons/react';
import type { ResolvedFolder } from '../models';
import { getFolderTextColor, getFolderTintStyle } from '../lib';
import FolderGlyph from './FolderGlyph';

type Props = {
  folders: ResolvedFolder[];
  folderId: string | null;
  onSelect: (id: string) => void;
  onRemove: () => void;
};

/** Пункты меню «В закладки» — одни и те же в читалке и в S3: папки, ниже за чертой — «Убрать».
 *  Выглядят как пункты «В закладки» (S4): выбранная папка — в её цвете. */
function FolderMenuItems({ folders, folderId, onSelect, onRemove }: Props) {
  return (
    <>
      {folders.map((folder) => (
        <Menu.Item
          key={folder.id}
          // Выбранная папка — как в «В закладки» (S4): подложка, рамка и текст цветом папки.
          className="selectableOption"
          style={folder.id === folderId ? getFolderTintStyle(folder.color) : undefined}
          leftSection={<FolderGlyph folder={folder} />}
          rightSection={
            folder.id === folderId && <CheckIcon color={getFolderTextColor(folder.color)} />
          }
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
        </Menu.Item>
      ))}
      {folderId && (
        <>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onRemove}>
            Убрать из закладок
          </Menu.Item>
        </>
      )}
    </>
  );
}

export default FolderMenuItems;
