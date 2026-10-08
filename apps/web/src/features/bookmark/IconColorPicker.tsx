import { ActionIcon, ColorSwatch, Group, Stack, Text } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  type BookmarkFolderColor,
  type BookmarkFolderIcon,
} from '@tanuki/contracts';
import { getBookmarkFolderColorLabel, renderBookmarkFolderIcon } from '@/entities/bookmark/lib';

type Props = {
  icon: BookmarkFolderIcon;
  color: BookmarkFolderColor;
  onIconChange: (icon: BookmarkFolderIcon) => void;
  onColorChange: (color: BookmarkFolderColor) => void;
};

const ICONS = Object.values(BOOKMARK_FOLDER_ICON);
const COLORS = Object.values(BOOKMARK_FOLDER_COLOR);

/** Выбор цвета и иконки папки (P2): цвета сверху, иконки под ними уже в выбранном цвете, у
 *  выбранной залит фон. Иконки контурные, как во всём приложении. */
function IconColorPicker({ icon, color, onIconChange, onColorChange }: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Stack gap={6}>
        <Text fz={13} c="dimmed">
          {t('color')}
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
              aria-label={getBookmarkFolderColorLabel(item, t)}
              aria-pressed={item === color}
              c="white"
              style={{ cursor: 'pointer' }}
            >
              {item === color && <CheckIcon size={12} weight="bold" />}
            </ColorSwatch>
          ))}
        </Group>
      </Stack>
      <Stack gap={6}>
        <Text fz={13} c="dimmed">
          {t('icon')}
        </Text>
        <Group gap={4}>
          {ICONS.map((item, index) => {
            const isSelected = item === icon;

            return (
              <ActionIcon
                key={item}
                size={34}
                variant={isSelected ? 'filled' : 'subtle'}
                color={color}
                onClick={() => onIconChange(item)}
                aria-label={t('iconNumber', { number: index + 1 })}
                aria-pressed={isSelected}
              >
                {renderBookmarkFolderIcon(item, {
                  size: 18,
                  color: isSelected ? undefined : `var(--mantine-color-${color}-text)`,
                })}
              </ActionIcon>
            );
          })}
        </Group>
      </Stack>
    </Stack>
  );
}

export default IconColorPicker;
