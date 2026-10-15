import { useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { FolderSimplePlusIcon, TrashIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import DeleteFolderModal from '../../Bookmarks/components/DeleteFolderModal';
import FolderModal from '../../Bookmarks/components/FolderModal';
import { ICON_PICKER_VARIANT, type MockFolder } from '../../Bookmarks/models';
import { getBlockTexts } from '../lib';
import type { RowVariant } from '../models';
import EditFolderModal from './EditFolderModal';
import FolderRowMock from './FolderRowMock';

type Props = {
  folders: MockFolder[];
  /** Блоки списка сверху вниз, у каждого строки своего вида; «Новая папка» — в подвале первого. */
  blocks: RowVariant[];
};

/** Настройки → «Закладки»: папки одним или несколькими блоками, тумблеры и модалки живые. */
function FolderSettingsMock({ folders, blocks }: Props) {
  const [tracked, setTracked] = useState(() =>
    Object.fromEntries(folders.map(({ id, trackUpdates }) => [id, trackUpdates])),
  );
  const [renamed, setRenamed] = useState<MockFolder | null>(null);
  const [edited, setEdited] = useState<MockFolder | null>(null);
  const [deleted, setDeleted] = useState<MockFolder | null>(null);
  const [isCreateOpened, setIsCreateOpened] = useState(false);
  const hasCustom = folders.some(({ builtIn }) => builtIn === null);

  return (
    <Stack gap="lg">
      {blocks.map((variant, index) => {
        const { label, title, description } = getBlockTexts(variant);

        return (
          <GroupedList key={variant} label={label}>
            <GroupedList.Header title={title} description={description} />
            {folders.map((folder) => (
              <FolderRowMock
                key={folder.id}
                folder={folder}
                variant={variant}
                hasCustom={hasCustom}
                isTracked={tracked[folder.id] ?? folder.trackUpdates}
                onTrackedChange={(isTracked) => setTracked({ ...tracked, [folder.id]: isTracked })}
                onRename={() => setRenamed(folder)}
                onDelete={() => setDeleted(folder)}
                onEdit={() => setEdited(folder)}
              />
            ))}
            {index === 0 && (
              <GroupedList.Footer>
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<FolderSimplePlusIcon />}
                  onClick={() => setIsCreateOpened(true)}
                >
                  Новая папка
                </Button>
              </GroupedList.Footer>
            )}
          </GroupedList>
        );
      })}
      <FolderModal
        key={isCreateOpened ? 'create-opened' : 'create'}
        opened={isCreateOpened}
        onClose={() => setIsCreateOpened(false)}
        pickerVariant={ICON_PICKER_VARIANT.TINTED}
      />
      {renamed && (
        <FolderModal
          opened
          onClose={() => setRenamed(null)}
          pickerVariant={ICON_PICKER_VARIANT.TINTED}
          folder={renamed}
        />
      )}
      <EditFolderModal
        folder={edited}
        onClose={() => setEdited(null)}
        deleteButton={
          <Button
            variant="subtle"
            color="red"
            leftSection={<TrashIcon />}
            onClick={() => {
              setEdited(null);
              setDeleted(edited);
            }}
          >
            Удалить папку
          </Button>
        }
      />
      {deleted && <DeleteFolderModal opened onClose={() => setDeleted(null)} folder={deleted} />}
    </Stack>
  );
}

export default FolderSettingsMock;
