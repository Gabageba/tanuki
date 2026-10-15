import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CheckIcon, FolderSimplePlusIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import DeleteFolderModal from '../../Bookmarks/components/DeleteFolderModal';
import FolderModal from '../../Bookmarks/components/FolderModal';
import { ICON_PICKER_VARIANT, type MockFolder } from '../../Bookmarks/models';
import { getEditableHeaderDescription } from '../lib';
import { DELETE_PLACE, DROP_ZONE_ID, EDIT_HINT, type DeletePlace, type EditHint } from '../models';
import DeleteFolderZone from './DeleteFolderZone';
import DropDeleteZone from './DropDeleteZone';
import EditFolderModal from './EditFolderModal';
import EditableFolderRow from './EditableFolderRow';
import FolderEditForm from './FolderEditForm';

type Props = {
  folders: MockFolder[];
  hint: EditHint;
  deletion: DeletePlace;
  /** E3 — какая строка раскрыта сразу. */
  initialExpandedId?: string;
};

/** Настройки → «Закладки» без меню у строк (оси E и D): справа у всех тумблер, своя папка
 *  открывается кликом по строке. Тумблеры, редактор, удаление и перетаскивание живые. */
function EditableFoldersMock({ folders, hint, deletion, initialExpandedId }: Props) {
  const [tracked, setTracked] = useState(() =>
    Object.fromEntries(folders.map(({ id, trackUpdates }) => [id, trackUpdates])),
  );
  const [expandedId, setExpandedId] = useState(initialExpandedId ?? null);
  const [edited, setEdited] = useState<MockFolder | null>(null);
  const [deleted, setDeleted] = useState<MockFolder | null>(null);
  const [isCreateOpened, setIsCreateOpened] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const hasCustom = folders.some(({ builtIn }) => builtIn === null);
  const dragged = folders.find(({ id }) => id === draggedId);
  const isDropZoneShown = deletion === DELETE_PLACE.DROP_ZONE && dragged?.builtIn === null;

  const openFolder = (folder: MockFolder) => {
    if (hint === EDIT_HINT.EXPAND) {
      setExpandedId(expandedId === folder.id ? null : folder.id);
      return;
    }
    setEdited(folder);
  };

  const getDeleteZone = (folder: MockFolder, close: () => void) =>
    deletion === DELETE_PLACE.ZONE && (
      <DeleteFolderZone
        onDelete={() => {
          close();
          setDeleted(folder);
        }}
      />
    );

  const handleDragStart = ({ active }: DragStartEvent) => setDraggedId(String(active.id));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedId(null);
    const folder = folders.find(({ id }) => id === active.id);
    if (over?.id === DROP_ZONE_ID && folder?.builtIn === null) setDeleted(folder);
  };

  const getFooter = () => {
    if (isDropZoneShown) return <DropDeleteZone />;
    if (isEditMode) {
      return (
        <Button
          size="xs"
          variant="default"
          leftSection={<CheckIcon />}
          onClick={() => setIsEditMode(false)}
        >
          Готово
        </Button>
      );
    }
    return (
      <Group gap="xs">
        <Button
          size="xs"
          variant="default"
          leftSection={<FolderSimplePlusIcon />}
          onClick={() => setIsCreateOpened(true)}
        >
          Новая папка
        </Button>
        {deletion === DELETE_PLACE.EDIT_MODE && hasCustom && (
          <Button
            size="xs"
            variant="default"
            leftSection={<PencilSimpleIcon />}
            onClick={() => {
              setExpandedId(null);
              setIsEditMode(true);
            }}
          >
            Изменить список
          </Button>
        )}
      </Group>
    );
  };

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <GroupedList label="Папки">
          <GroupedList.Header
            title={isEditMode ? 'Удаление папок' : 'Порядок и обновления'}
            description={getEditableHeaderDescription(deletion, isEditMode, hasCustom)}
          />
          {folders.map((folder) => (
            <EditableFolderRow
              key={folder.id}
              folder={folder}
              hint={hint}
              isEditMode={isEditMode}
              isExpanded={expandedId === folder.id}
              isTracked={tracked[folder.id] ?? folder.trackUpdates}
              onTrackedChange={(isTracked) => setTracked({ ...tracked, [folder.id]: isTracked })}
              onOpen={() => openFolder(folder)}
              onDelete={() => setDeleted(folder)}
            >
              <FolderEditForm
                folder={folder}
                onClose={() => setExpandedId(null)}
                isInModal={false}
                deleteZone={getDeleteZone(folder, () => setExpandedId(null))}
              />
            </EditableFolderRow>
          ))}
          <GroupedList.Footer>{getFooter()}</GroupedList.Footer>
        </GroupedList>
      </DndContext>
      <FolderModal
        key={isCreateOpened ? 'create-opened' : 'create'}
        opened={isCreateOpened}
        onClose={() => setIsCreateOpened(false)}
        pickerVariant={ICON_PICKER_VARIANT.TINTED}
      />
      <EditFolderModal
        folder={edited}
        onClose={() => setEdited(null)}
        deleteZone={edited && getDeleteZone(edited, () => setEdited(null))}
      />
      {deleted && <DeleteFolderModal opened onClose={() => setDeleted(null)} folder={deleted} />}
    </>
  );
}

export default EditableFoldersMock;
