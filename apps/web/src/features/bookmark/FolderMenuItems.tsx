import { Menu } from '@mantine/core';
import { CheckIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import { getBookmarkFolderTextColor, getBookmarkFolderTintStyle } from '@/entities/bookmark/lib';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = {
  folders: ResolvedBookmarkFolder[];
  folderId: string | null;
  onSelect: (id: string) => void;
  onRemove: () => void;
};

/** Пункты меню «В закладки» в читалке: папки — выбранная в её цвете, как в S4, — и за чертой
 *  «Убрать из закладок». */
function FolderMenuItems({ folders, folderId, onSelect, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {folders.map((folder) => {
        const isSelected = folder.id === folderId;

        return (
          <Menu.Item
            key={folder.id}
            className="selectable-option"
            style={isSelected ? getBookmarkFolderTintStyle(folder.color) : undefined}
            leftSection={<FolderGlyph folder={folder} />}
            rightSection={
              isSelected && <CheckIcon color={getBookmarkFolderTextColor(folder.color)} />
            }
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </Menu.Item>
        );
      })}
      {folderId && (
        <>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onRemove}>
            {t('removeFromBookmarks')}
          </Menu.Item>
        </>
      )}
    </>
  );
}

export default FolderMenuItems;
