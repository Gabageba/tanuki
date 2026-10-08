import { useState } from 'react';
import { ActionIcon, Box, Button, Group, Menu, Switch, Text, Tooltip } from '@mantine/core';
import {
  DotsSixVerticalIcon,
  DotsThreeIcon,
  FolderSimplePlusIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getTitlesCountLabel, resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import {
  BUILT_IN_STYLE,
  CUSTOM_FOLDERS_LIMIT,
  ICON_PICKER_VARIANT,
  type IconPickerVariant,
  type MockFolder,
} from '../models';
import DeleteFolderModal from './DeleteFolderModal';
import FolderGlyph from './FolderGlyph';
import FolderModal from './FolderModal';
import styles from '../Bookmarks.module.scss';

type Props = {
  /** F2 — под названием число тайтлов. */
  withCount: boolean;
  /** Своих папок уже 20 — «Новая папка» неактивна. */
  isLimitReached?: boolean;
  pickerVariant?: IconPickerVariant;
};

/** Настройки → «Закладки»: список папок как список источников — ручка, иконка, название,
 *  тумблер «Следить за обновлениями», у своих — меню. */
function SettingsFoldersMock({
  withCount,
  isLimitReached = false,
  pickerVariant = ICON_PICKER_VARIANT.SEPARATE,
}: Props) {
  const [tracked, setTracked] = useState(() =>
    Object.fromEntries(MOCK_FOLDERS.map(({ id, trackUpdates }) => [id, trackUpdates])),
  );
  const [renamed, setRenamed] = useState<MockFolder | null>(null);
  const [deleted, setDeleted] = useState<MockFolder | null>(null);
  const [isCreateOpened, setIsCreateOpened] = useState(false);

  const createButton = (
    <Button
      size="xs"
      variant="default"
      leftSection={<FolderSimplePlusIcon />}
      disabled={isLimitReached}
      onClick={() => setIsCreateOpened(true)}
    >
      Новая папка
    </Button>
  );

  return (
    <>
      <GroupedList label="Папки">
        <GroupedList.Header
          title="Порядок и обновления"
          description="Перетащите папку, чтобы поменять порядок вкладок. Тумблер — следить за обновлениями: проверять новые главы и показывать их число на карточке."
        />
        {MOCK_FOLDERS.map((folder) => {
          const resolved = resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC);

          return (
            <Box key={folder.id} className={styles.sortableRow}>
              <GroupedList.Row
                icon={
                  <Group gap="xs" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      className={styles.dragHandle}
                      aria-label="Изменить порядок"
                    >
                      <DotsSixVerticalIcon />
                    </ActionIcon>
                    <FolderGlyph folder={resolved} size={22} />
                  </Group>
                }
                title={
                  <Text fz={14} lh="tight" truncate title={resolved.name}>
                    {resolved.name}
                  </Text>
                }
                description={
                  withCount && (
                    <Text fz={12} lh="tight" c="dimmed">
                      {folder.count > 0 ? getTitlesCountLabel(folder.count) : 'Пусто'}
                    </Text>
                  )
                }
                isActionCompact
                action={
                  <Group gap="xs" wrap="nowrap">
                    <Switch
                      checked={tracked[folder.id]}
                      onChange={(event) =>
                        setTracked({ ...tracked, [folder.id]: event.currentTarget.checked })
                      }
                      aria-label="Следить за обновлениями"
                      classNames={{ track: styles.switchTrack }}
                    />
                    {/* У встроенных меню нет — место держим, чтобы тумблеры стояли колонкой. */}
                    {resolved.isBuiltIn ? (
                      <Box w={28} />
                    ) : (
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" aria-label="Действия с папкой">
                            <DotsThreeIcon />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<PencilSimpleIcon />}
                            onClick={() => setRenamed(folder)}
                          >
                            Переименовать
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            leftSection={<TrashIcon />}
                            onClick={() => setDeleted(folder)}
                          >
                            Удалить
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                }
              />
            </Box>
          );
        })}
        <GroupedList.Footer>
          {isLimitReached ? (
            <Tooltip label={`Своих папок может быть не больше ${CUSTOM_FOLDERS_LIMIT}`}>
              <Box>{createButton}</Box>
            </Tooltip>
          ) : (
            createButton
          )}
        </GroupedList.Footer>
      </GroupedList>
      <FolderModal
        key={isCreateOpened ? 'create-opened' : 'create'}
        opened={isCreateOpened}
        onClose={() => setIsCreateOpened(false)}
        pickerVariant={pickerVariant}
      />
      {renamed && (
        <FolderModal
          opened
          onClose={() => setRenamed(null)}
          pickerVariant={pickerVariant}
          folder={renamed}
        />
      )}
      {deleted && <DeleteFolderModal opened onClose={() => setDeleted(null)} folder={deleted} />}
    </>
  );
}

export default SettingsFoldersMock;
