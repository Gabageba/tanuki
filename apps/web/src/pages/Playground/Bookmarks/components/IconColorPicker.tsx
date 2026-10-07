import { ActionIcon, ColorSwatch, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { renderFolderIcon } from '../lib';
import {
  FOLDER_COLOR,
  FOLDER_ICON,
  ICON_PICKER_VARIANT,
  type FolderColor,
  type FolderIcon,
  type IconPickerVariant,
} from '../models';

type Props = {
  variant: IconPickerVariant;
  icon: FolderIcon;
  color: FolderColor;
  onIconChange: (icon: FolderIcon) => void;
  onColorChange: (color: FolderColor) => void;
};

const ICONS = Object.values(FOLDER_ICON);
const COLORS = Object.values(FOLDER_COLOR);

/** Выбор иконки и цвета папки. Иконки контурные, как во всём приложении. P1 — иконки серые,
 *  выбранная в рамке; P2 — иконки сразу в выбранном цвете, у выбранной залит фон. */
function IconColorPicker({ variant, icon, color, onIconChange, onColorChange }: Props) {
  const isTinted = variant === ICON_PICKER_VARIANT.TINTED;

  const colors = (
    <Stack gap={6}>
      <Text fz={13} c="dimmed">
        Цвет
      </Text>
      <Group gap={8}>
        {COLORS.map((item) => (
          <ColorSwatch
            key={item}
            component="button"
            type="button"
            size={26}
            color={`var(--mantine-color-${item}-filled)`}
            onClick={() => onColorChange(item)}
            aria-label={item}
            c="white"
            style={{ cursor: 'pointer' }}
          >
            {item === color && <CheckIcon size={12} weight="bold" />}
          </ColorSwatch>
        ))}
      </Group>
    </Stack>
  );

  const icons = (
    <Stack gap={6}>
      <Text fz={13} c="dimmed">
        Иконка
      </Text>
      <SimpleGrid cols={9} spacing={4} verticalSpacing={4} w="fit-content">
        {ICONS.map((item) => {
          const isSelected = item === icon;
          const getVariant = () => {
            if (!isSelected) return 'subtle';
            return isTinted ? 'filled' : 'default';
          };

          return (
            <ActionIcon
              key={item}
              size={34}
              variant={getVariant()}
              color={isTinted ? color : 'gray'}
              onClick={() => onIconChange(item)}
              aria-label={item}
              aria-pressed={isSelected}
            >
              {renderFolderIcon(item, {
                size: 18,
                color: isTinted && !isSelected ? `var(--mantine-color-${color}-text)` : undefined,
              })}
            </ActionIcon>
          );
        })}
      </SimpleGrid>
    </Stack>
  );

  return (
    <Stack gap="md">
      {isTinted ? colors : icons}
      {isTinted ? icons : colors}
    </Stack>
  );
}

export default IconColorPicker;
