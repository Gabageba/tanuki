import type { CSSProperties } from 'react';
import { Center, Combobox, Group, Input, InputBase, Text, useCombobox } from '@mantine/core';
import { BookmarkSimpleIcon, CheckIcon, TrashIcon } from '@phosphor-icons/react';
import { getFolderTextColor, getFolderTintStyle } from '../lib';
import { PICKER_VARIANT, type PickerVariant, type ResolvedFolder } from '../models';
import FolderChoiceIcon from './FolderChoiceIcon';
import FolderGlyph from './FolderGlyph';

type Props = {
  folders: ResolvedFolder[];
  folderId: string | null;
  onSelect: (id: string) => void;
  onRemove: () => void;
  /** S1–S2 и S4–S7: как выглядят поле и выбранный пункт. */
  variant: PickerVariant;
  defaultOpened?: boolean;
};

const REMOVE_VALUE = 'remove';

/**
 * Поле «В закладки» на странице тайтла: выглядит как Select, но «Убрать» отделено чертой — у
 * обычного Select такого пункта нет, поэтому собран из Combobox, как сортировка каталога.
 *
 * S1/S2 — выбранный пункт стандартный (акцент), иконка выбранной в плашке; S4 — выбранный пункт
 * в цвете папки; S5 — без подложки, только галочка и залитая иконка; S6 — иконки без цвета;
 * S7 — как S4, и само поле окрашено в цвет папки.
 */
function FolderPickerSelect({
  folders,
  folderId,
  onSelect,
  onRemove,
  variant,
  defaultOpened = false,
}: Props) {
  const combobox = useCombobox({ defaultOpened });
  const folder = folders.find(({ id }) => id === folderId);

  const isFolderTint =
    variant === PICKER_VARIANT.SELECT_FOLDER_TINT || variant === PICKER_VARIANT.SELECT_FOLDER_FIELD;
  const isPlain = variant === PICKER_VARIANT.SELECT_PLAIN;
  const isMono = variant === PICKER_VARIANT.SELECT_MONO;
  const isStandard = !isFolderTint && !isPlain && !isMono;

  const getOptionIcon = (item: ResolvedFolder, isSelected: boolean) => {
    if (isStandard) return <FolderChoiceIcon folder={item} isSelected={isSelected} />;
    if (isMono) {
      return (
        <FolderGlyph
          folder={item}
          size={14}
          color={isSelected ? 'currentColor' : 'var(--mantine-color-dimmed)'}
        />
      );
    }
    return (
      <FolderGlyph folder={item} size={14} weight={isSelected && isPlain ? 'fill' : 'regular'} />
    );
  };

  const getCheckColor = (item: ResolvedFolder) =>
    isFolderTint ? getFolderTextColor(item.color) : 'var(--mantine-primary-color-filled)';

  const getFieldStyle = (): CSSProperties | undefined => {
    if (!folder || variant !== PICKER_VARIANT.SELECT_FOLDER_FIELD) return undefined;
    return getFolderTintStyle(folder.color);
  };

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(value) => {
        if (value === REMOVE_VALUE) {
          onRemove();
        } else {
          onSelect(value);
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
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          styles={{ input: getFieldStyle() }}
          leftSection={
            folder ? (
              isStandard ? (
                <FolderChoiceIcon folder={folder} isSelected size={20} iconSize={12} />
              ) : (
                <FolderGlyph folder={folder} size={14} weight={isPlain ? 'fill' : 'regular'} />
              )
            ) : (
              <Center c="dimmed">
                <BookmarkSimpleIcon size={14} />
              </Center>
            )
          }
          onClick={() => combobox.toggleDropdown()}
        >
          {folder ? (
            <Text inherit truncate c={isFolderTint ? getFolderTextColor(folder.color) : undefined}>
              {folder.name}
            </Text>
          ) : (
            <Input.Placeholder>В закладки</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {folders.map((item) => {
            const isSelected = item.id === folderId;

            return (
              <Combobox.Option
                key={item.id}
                value={item.id}
                // S5: без отметки selected — у неё своя подложка, а тут выбор только галочкой.
                selected={isPlain ? undefined : isSelected}
                className="selectable-option"
                style={isFolderTint && isSelected ? getFolderTintStyle(item.color) : undefined}
              >
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Group gap="xs" wrap="nowrap" miw={0}>
                    {getOptionIcon(item, isSelected)}
                    <Text inherit truncate>
                      {item.name}
                    </Text>
                  </Group>
                  {isSelected && <CheckIcon color={getCheckColor(item)} style={{ flex: 'none' }} />}
                </Group>
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
        {folder && (
          <Combobox.Footer p={4}>
            <Combobox.Option value={REMOVE_VALUE}>
              <Group
                gap="xs"
                wrap="nowrap"
                c={variant === PICKER_VARIANT.SELECT_GRAY ? 'dimmed' : 'red'}
              >
                <TrashIcon size={14} />
                <Text inherit>Убрать из закладок</Text>
              </Group>
            </Combobox.Option>
          </Combobox.Footer>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default FolderPickerSelect;
