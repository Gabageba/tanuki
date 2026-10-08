import { ActionIcon, Menu } from '@mantine/core';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import FolderMenuItems from './FolderMenuItems';
import useRemoveTitleBookmark from './hooks/useRemoveTitleBookmark';
import useSetTitleBookmark from './hooks/useSetTitleBookmark';
import useTitleBookmark from './hooks/useTitleBookmark';

type Props = {
  titleId: string;
};

/**
 * Кнопка закладки в панели читалки (R2c): не в закладках — серая контурная закладка, в закладках
 * — контурная иконка самой папки её цветом. Тап открывает те же пункты, что «В закладки».
 */
function BookmarkMenuButton({ titleId }: Props) {
  const { t } = useTranslation();
  const { data: folders } = useBookmarkFolders();
  const { data: bookmark } = useTitleBookmark(titleId);
  const setBookmark = useSetTitleBookmark(titleId);
  const removeBookmark = useRemoveTitleBookmark(titleId);

  const folderId = bookmark?.folderId ?? null;
  const folder = folders?.items.find(({ id }) => id === folderId);

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label={folder?.name ?? t('toBookmarks')}
          disabled={!folders}
        >
          {folder ? <FolderGlyph folder={folder} size={20} /> : <BookmarkSimpleIcon />}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <FolderMenuItems
          folders={folders?.items ?? []}
          folderId={folderId}
          onSelect={(id) => setBookmark.mutate(id)}
          onRemove={() => removeBookmark.mutate()}
        />
      </Menu.Dropdown>
    </Menu>
  );
}

export default BookmarkMenuButton;
