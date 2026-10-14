import { ActionIcon, Box, Group, Menu, Switch, Text } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DotsSixVerticalIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import GroupedList from '@/shared/ui/GroupedList';
import useToggleFolderTracking from './hooks/useToggleFolderTracking';
import { FOLDER_MENU_WIDTH } from './models';
import styles from '../../Settings.module.scss';

type Props = {
  folder: ResolvedBookmarkFolder;
  onRename: () => void;
  onDelete: () => void;
};

/** Папка в настройках (F1): ручка, иконка, название, тумблер, у своих — меню. */
function FolderRow({ folder, onRename, onDelete }: Props) {
  const { t } = useTranslation();
  const toggleTracking = useToggleFolderTracking();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
  });

  return (
    <Box
      ref={setNodeRef}
      className={styles.sortableRow}
      mod={{ dragging: isDragging }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <GroupedList.Row
        icon={
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={styles.dragHandle}
              aria-label={t('changeOrder')}
              {...attributes}
              {...listeners}
            >
              <DotsSixVerticalIcon />
            </ActionIcon>
            <FolderGlyph folder={folder} size={22} />
          </Group>
        }
        title={
          <Text fz={14} lh="tight" truncate title={folder.name}>
            {folder.name}
          </Text>
        }
        isActionCompact
        action={
          <Group gap="xs" wrap="nowrap">
            <Switch
              checked={folder.trackUpdates}
              onChange={(event) =>
                toggleTracking.mutate({
                  folderId: folder.id,
                  trackUpdates: event.currentTarget.checked,
                })
              }
              aria-label={t('trackUpdates')}
              classNames={{ track: styles.switchTrack }}
            />
            {folder.builtIn ? (
              <Box w={FOLDER_MENU_WIDTH} />
            ) : (
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" aria-label={t('folderActions')}>
                    <DotsThreeIcon />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<PencilSimpleIcon />} onClick={onRename}>
                    {t('rename')}
                  </Menu.Item>
                  <Menu.Item color="red" leftSection={<TrashIcon />} onClick={onDelete}>
                    {t('delete')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        }
      />
    </Box>
  );
}

export default FolderRow;
