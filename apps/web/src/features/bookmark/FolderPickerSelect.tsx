import {
  Center,
  Combobox,
  Group,
  Input,
  InputBase,
  Skeleton,
  Text,
  useCombobox,
} from '@mantine/core';
import { BookmarkSimpleIcon, CheckIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import useBookmarkFolders from '@/entities/bookmark/hooks/useBookmarkFolders';
import { getBookmarkFolderTextColor, getBookmarkFolderTintStyle } from '@/entities/bookmark/lib';
import useRemoveTitleBookmark from './hooks/useRemoveTitleBookmark';
import useSetTitleBookmark from './hooks/useSetTitleBookmark';
import useTitleBookmark from './hooks/useTitleBookmark';

type Props = {
  titleId: string;
};

const REMOVE_VALUE = 'remove';

/**
 * «В закладки» на странице тайтла (S4). Выглядит как Select, но «Убрать из закладок» отделено
 * чертой — у Select пункта-действия нет, поэтому собран из Combobox, как сортировка каталога.
 * Выбранный пункт красится в цвет папки, а не в акцент.
 */
function FolderPickerSelect({ titleId }: Props) {
  const { t } = useTranslation();
  const combobox = useCombobox();
  const { data: folders, isPending: isFoldersPending } = useBookmarkFolders();
  const { data: bookmark, isPending: isBookmarkPending } = useTitleBookmark(titleId);
  const setBookmark = useSetTitleBookmark(titleId);
  const removeBookmark = useRemoveTitleBookmark(titleId);

  if (isFoldersPending || isBookmarkPending) {
    return <Skeleton h={36} flex={1} />;
  }

  const items = folders?.items ?? [];
  const folderId = bookmark?.folderId ?? null;
  const folder = items.find(({ id }) => id === folderId);

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(value) => {
        if (value === REMOVE_VALUE) {
          removeBookmark.mutate();
        } else if (value !== folderId) {
          setBookmark.mutate(value);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          flex={1}
          miw={0}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          leftSection={
            folder ? (
              <FolderGlyph folder={folder} size={14} />
            ) : (
              <Center c="dimmed">
                <BookmarkSimpleIcon size={14} />
              </Center>
            )
          }
          onClick={() => combobox.toggleDropdown()}
        >
          {folder ? (
            <Text inherit truncate c={getBookmarkFolderTextColor(folder.color)}>
              {folder.name}
            </Text>
          ) : (
            <Input.Placeholder>{t('toBookmarks')}</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {items.map((item) => {
            const isSelected = item.id === folderId;

            return (
              <Combobox.Option
                key={item.id}
                value={item.id}
                selected={isSelected}
                className="selectable-option"
                style={isSelected ? getBookmarkFolderTintStyle(item.color) : undefined}
              >
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Group gap="xs" wrap="nowrap" miw={0}>
                    <FolderGlyph folder={item} size={14} />
                    <Text inherit truncate title={item.name}>
                      {item.name}
                    </Text>
                  </Group>
                  {isSelected && (
                    <CheckIcon
                      color={getBookmarkFolderTextColor(item.color)}
                      style={{ flex: 'none' }}
                    />
                  )}
                </Group>
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
        {folder && (
          <Combobox.Footer p={4}>
            <Combobox.Option value={REMOVE_VALUE}>
              <Group gap="xs" wrap="nowrap" c="red">
                <TrashIcon size={14} />
                <Text inherit>{t('removeFromBookmarks')}</Text>
              </Group>
            </Combobox.Option>
          </Combobox.Footer>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default FolderPickerSelect;
