import { ActionIcon, Menu } from '@mantine/core';
import { DotsThreeIcon, FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import type { SourceId } from '@tanuki/contracts';
import useMockFolderChoice from '../hooks/useMockFolderChoice';
import { resolveFolder, stopCardClick } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE } from '../models';
import FolderMenuItems from './FolderMenuItems';
import SourcesMenuItems from './SourcesMenuItems';
import styles from '../Bookmarks.module.scss';

type Props = {
  sourceIds: SourceId[];
  folderId: string;
  /** Итог Q4 — «Перенести в папку» открывает подменю папок, «Убрать» — с тостом «Вернуть». */
  withFolders?: boolean;
};

/** Q4 — меню «⋯» карточки: другие источники и действия с закладкой в одном месте. */
function CardActionsMenu({ sourceIds, folderId, withFolders = false }: Props) {
  const choice = useMockFolderChoice(folderId);
  const folders = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size={24}
          ml="auto"
          flex="none"
          aria-label="Действия с закладкой"
          onClick={stopCardClick}
          className={styles.hitArea}
        >
          <DotsThreeIcon size={18} weight="bold" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {sourceIds.length > 1 && (
          <>
            <SourcesMenuItems sourceIds={sourceIds} />
            <Menu.Divider />
          </>
        )}
        {withFolders ? (
          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item leftSection={<FolderSimpleIcon size={16} />}>
                Перенести в папку
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <FolderMenuItems
                folders={folders}
                folderId={choice.folderId}
                onSelect={choice.select}
                onRemove={choice.remove}
                withRemove={false}
              />
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        ) : (
          <Menu.Item leftSection={<FolderSimpleIcon size={16} />}>Перенести в папку</Menu.Item>
        )}
        <Menu.Item
          color="red"
          leftSection={<TrashIcon size={16} />}
          onClick={withFolders ? choice.remove : undefined}
        >
          Убрать из закладок
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default CardActionsMenu;
