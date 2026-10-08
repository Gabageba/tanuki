import { useState } from 'react';
import { Box, Button, Stack, Tooltip } from '@mantine/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FolderSimplePlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { CUSTOM_BOOKMARK_FOLDERS_LIMIT } from '@tanuki/contracts';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import FolderModal from '@/features/bookmark/FolderModal';
import GroupedList from '@/shared/ui/GroupedList';
import DeleteFolderModal from './DeleteFolderModal';
import FolderRow from './FolderRow';
import useReorderBookmarkFolders from './hooks/useReorderBookmarkFolders';

/** Настройки → «Закладки»: порядок вкладок-папок, слежение за обновлениями, свои папки. */
function SettingsBookmarks() {
  const { t } = useTranslation();
  const { data, isPending } = useBookmarkFolders();
  const reorderFolders = useReorderBookmarkFolders();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [isCreateOpened, setIsCreateOpened] = useState(false);
  const [renamed, setRenamed] = useState<ResolvedBookmarkFolder | null>(null);
  const [deleted, setDeleted] = useState<ResolvedBookmarkFolder | null>(null);

  const folders = data?.items ?? [];
  const folderIds = folders.map(({ id }) => id);
  const isLimitReached =
    folders.filter(({ builtIn }) => builtIn === null).length >= CUSTOM_BOOKMARK_FOLDERS_LIMIT;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = folderIds.indexOf(String(active.id));
    const to = folderIds.indexOf(String(over.id));
    reorderFolders.mutate(arrayMove(folderIds, from, to));
  };

  const createButton = (
    <Button
      size="xs"
      variant="default"
      leftSection={<FolderSimplePlusIcon />}
      disabled={isLimitReached}
      onClick={() => setIsCreateOpened(true)}
    >
      {t('newFolder')}
    </Button>
  );

  return (
    <Stack mt="lg" maw={640}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
          <GroupedList label={t('folders')} loading={isPending}>
            <GroupedList.Header
              title={t('orderAndUpdates')}
              description={t('dragFolderToReorderTabs')}
            />
            {folders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                onRename={() => setRenamed(folder)}
                onDelete={() => setDeleted(folder)}
              />
            ))}
            <GroupedList.Footer>
              {isLimitReached ? (
                <Tooltip label={t('customFoldersLimit', { count: CUSTOM_BOOKMARK_FOLDERS_LIMIT })}>
                  <Box>{createButton}</Box>
                </Tooltip>
              ) : (
                createButton
              )}
            </GroupedList.Footer>
          </GroupedList>
        </SortableContext>
      </DndContext>
      {isCreateOpened && <FolderModal opened onClose={() => setIsCreateOpened(false)} />}
      {renamed && <FolderModal opened folder={renamed} onClose={() => setRenamed(null)} />}
      {deleted && (
        <DeleteFolderModal folder={deleted} folders={folders} onClose={() => setDeleted(null)} />
      )}
    </Stack>
  );
}

export default SettingsBookmarks;
