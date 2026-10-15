import { useContext, type MouseEvent, type ReactNode } from 'react';
import { ActionIcon, Box, Group, Switch, Text } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  CaretDownIcon,
  CaretRightIcon,
  DotsSixVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import FolderGlyph from '../../Bookmarks/components/FolderGlyph';
import { resolveFolder } from '../../Bookmarks/lib';
import { BUILT_IN_STYLE, PHONE_FRAME_CONTEXT, type MockFolder } from '../../Bookmarks/models';
import { EDIT_HINT, type EditHint } from '../models';
import bookmarksStyles from '../../Bookmarks/Bookmarks.module.scss';
import styles from '../FolderRow.module.scss';

type Props = {
  folder: MockFolder;
  hint: EditHint;
  /** D1 — режим «Изменить список»: у своих корзина вместо тумблера, встроенные приглушены. */
  isEditMode: boolean;
  /** E3 — под строкой раскрыт редактор. */
  isExpanded: boolean;
  isTracked: boolean;
  onTrackedChange: (isTracked: boolean) => void;
  /** Клик по строке своей папки: модалка или раскрытие (E3). */
  onOpen: () => void;
  onDelete: () => void;
  /** E3 — редактор под строкой. */
  children?: ReactNode;
};

/** Клик по ручке, тумблеру и корзине не должен открывать папку. */
const stopPropagation = (event: MouseEvent) => event.stopPropagation();

/** Строка папки без меню: справа у всех тумблер, своя папка открывается кликом по строке. */
function EditableFolderRow({
  folder,
  hint,
  isEditMode,
  isExpanded,
  isTracked,
  onTrackedChange,
  onOpen,
  onDelete,
  children,
}: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const resolved = resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC);
  const isEditable = !resolved.isBuiltIn;
  const isClickable = isEditable && !isEditMode;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: folder.id,
  });

  const getHintIcon = () => {
    switch (hint) {
      case EDIT_HINT.HOVER_PENCIL:
        return (
          <Box c="dimmed" lh={0} flex="none" className={styles.hoverHint} mod={{ always: isPhone }}>
            <PencilSimpleIcon size={16} />
          </Box>
        );
      case EDIT_HINT.EXPAND:
        return (
          <Box c="dimmed" lh={0} flex="none">
            {isExpanded ? <CaretDownIcon size={16} /> : <CaretRightIcon size={16} />}
          </Box>
        );
      case EDIT_HINT.CAPTION:
        return null;
    }
  };

  const getCaption = () => {
    if (hint !== EDIT_HINT.CAPTION) return undefined;
    if (!isEditable) return 'Встроенная';
    return (
      <Group gap={4} wrap="nowrap" className={styles.editCaption}>
        <PencilSimpleIcon size={12} />
        Изменить
      </Group>
    );
  };

  const getAction = () => {
    if (!isEditMode) {
      return (
        <Box lh={0} onClick={stopPropagation}>
          <Switch
            checked={isTracked}
            onChange={(event) => onTrackedChange(event.currentTarget.checked)}
            aria-label="Следить за обновлениями"
            classNames={{ track: bookmarksStyles.switchTrack }}
          />
        </Box>
      );
    }
    if (!isEditable) return undefined;
    return (
      <ActionIcon variant="subtle" color="red" aria-label="Удалить папку" onClick={onDelete}>
        <TrashIcon />
      </ActionIcon>
    );
  };

  return (
    <Box
      ref={setNodeRef}
      className={`${bookmarksStyles.sortableRow} ${styles.row}`}
      mod={{ clickable: isClickable, dragging: isDragging }}
      style={{ transform: CSS.Translate.toString(transform) }}
      onClick={isClickable ? onOpen : undefined}
    >
      <GroupedList.Row
        disabled={isEditMode && !isEditable}
        icon={
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={bookmarksStyles.dragHandle}
              aria-label="Изменить порядок"
              onClick={stopPropagation}
              {...attributes}
              {...listeners}
            >
              <DotsSixVerticalIcon />
            </ActionIcon>
            <FolderGlyph folder={resolved} size={22} />
          </Group>
        }
        title={
          <Group gap={6} wrap="nowrap" miw={0}>
            <Text fz={14} lh="tight" truncate title={resolved.name}>
              {resolved.name}
            </Text>
            {isClickable && getHintIcon()}
          </Group>
        }
        description={getCaption()}
        isActionCompact
        action={getAction()}
      >
        {isExpanded && <Box onClick={stopPropagation}>{children}</Box>}
      </GroupedList.Row>
    </Box>
  );
}

export default EditableFolderRow;
