import { ActionIcon, Divider, Group, Menu, Paper, Text } from '@mantine/core';
import {
  BookmarkSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  GearSixIcon,
} from '@phosphor-icons/react';
import { getFolderTextColor, resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE, READER_VARIANT, type FolderChoice, type ReaderVariant } from '../models';
import useMockFolderChoice from '../hooks/useMockFolderChoice';
import FolderGlyph from './FolderGlyph';
import FolderMenuItems from './FolderMenuItems';

type Props = {
  variant: ReaderVariant;
  initialFolderId?: string | null;
  /** Общая папка снаружи — в «Итоге» её меняют и страница тайтла, и читалка. */
  choice?: FolderChoice;
};

/** Панель читалки (`ReaderControls`): навигация по главам, страницы, закладка, настройки. */
function ReaderBarMock({ variant, initialFolderId = null, choice }: Props) {
  const ownChoice = useMockFolderChoice(initialFolderId);
  const { folderId, select, remove } = choice ?? ownChoice;
  const folders = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));
  const folder = folders.find(({ id }) => id === folderId);

  const getIconColor = () => {
    if (!folder) return undefined;
    switch (variant) {
      case READER_VARIANT.CURRENT:
      case READER_VARIANT.NEUTRAL:
        return undefined;
      case READER_VARIANT.FOLDER_COLOR:
      case READER_VARIANT.FOLDER_OUTLINE:
      case READER_VARIANT.FOLDER_GLYPH:
        return getFolderTextColor(folder.color);
      case READER_VARIANT.ACCENT:
        return 'var(--mantine-primary-color-filled)';
    }
  };

  // Заливка — признак «в закладках» в R1–R3; в R2a/R2c иконка остаётся контурной.
  const isFilled =
    !!folder &&
    variant !== READER_VARIANT.CURRENT &&
    variant !== READER_VARIANT.FOLDER_OUTLINE &&
    variant !== READER_VARIANT.FOLDER_GLYPH;

  const bookmarkButton = (
    <ActionIcon variant="subtle" color="gray" size="lg" aria-label="В закладки">
      {folder && variant === READER_VARIANT.FOLDER_GLYPH ? (
        <FolderGlyph folder={folder} size={20} />
      ) : (
        <BookmarkSimpleIcon weight={isFilled ? 'fill' : 'regular'} color={getIconColor()} />
      )}
    </ActionIcon>
  );

  return (
    <Paper withBorder radius="md" px="xs" h={48} w="fit-content" maw="100%">
      <Group h="100%" gap="xs" wrap="nowrap">
        <Group gap={4} wrap="nowrap" miw={0}>
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Предыдущая глава">
            <CaretLeftIcon />
          </ActionIcon>
          <Text fz="sm" ff="monospace" truncate>
            Гл. 1090
          </Text>
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Следующая глава">
            <CaretRightIcon />
          </ActionIcon>
        </Group>
        <Divider orientation="vertical" h={26} my="auto" />
        <Group gap={4} wrap="nowrap" flex="none">
          <Text fz="sm" ff="monospace" c="dimmed" px={4}>
            12 / 40
          </Text>
          {variant === READER_VARIANT.CURRENT ? (
            bookmarkButton
          ) : (
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>{bookmarkButton}</Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{folder ? 'Папка закладки' : 'В закладки'}</Menu.Label>
                <FolderMenuItems
                  folders={folders}
                  folderId={folderId}
                  onSelect={select}
                  onRemove={remove}
                />
              </Menu.Dropdown>
            </Menu>
          )}
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Настройки читалки">
            <GearSixIcon />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}

export default ReaderBarMock;
