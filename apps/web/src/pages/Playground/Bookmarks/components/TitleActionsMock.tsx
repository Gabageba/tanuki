import { ActionIcon, Button, Group, Stack } from '@mantine/core';
import { DotsThreeIcon, PlayIcon } from '@phosphor-icons/react';
import { resolveFolder } from '../lib';
import { MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE, PICKER_VARIANT, type FolderChoice, type PickerVariant } from '../models';
import useMockFolderChoice from '../hooks/useMockFolderChoice';
import FolderMenuButton from './FolderMenuButton';
import FolderPickerSelect from './FolderPickerSelect';

type Props = {
  variant: PickerVariant;
  initialFolderId?: string | null;
  defaultOpened?: boolean;
  /** Общая папка снаружи — в «Итоге» её меняют и страница тайтла, и читалка. */
  choice?: FolderChoice;
};

/** Колонка под обложкой на странице тайтла: «Продолжить», ниже — «В закладки» и меню «…». */
function TitleActionsMock({
  variant,
  initialFolderId = null,
  defaultOpened = false,
  choice,
}: Props) {
  const ownChoice = useMockFolderChoice(initialFolderId);
  const { folderId, select, remove } = choice ?? ownChoice;
  const folders = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));

  return (
    <Stack gap={8} w={280} maw="100%">
      <Button leftSection={<PlayIcon weight="fill" />}>Продолжить</Button>
      <Group gap={8} wrap="nowrap">
        {variant === PICKER_VARIANT.MENU ? (
          <FolderMenuButton
            folders={folders}
            folderId={folderId}
            onSelect={select}
            onRemove={remove}
            defaultOpened={defaultOpened}
          />
        ) : (
          <FolderPickerSelect
            folders={folders}
            folderId={folderId}
            onSelect={select}
            onRemove={remove}
            variant={variant}
            defaultOpened={defaultOpened}
          />
        )}
        <ActionIcon size={36} variant="default" aria-label="Ещё">
          <DotsThreeIcon />
        </ActionIcon>
      </Group>
    </Stack>
  );
}

export default TitleActionsMock;
