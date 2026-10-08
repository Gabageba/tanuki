import { Group, Radio, Stack, Text } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import { getBookmarkFolderTintStyle } from '@/entities/bookmark/lib';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';

type Props = {
  folder: ResolvedBookmarkFolder;
  isChecked: boolean;
  /** Строка под названием — в M1d «Так лежит на <источник>». */
  description?: string;
};

/** Папка в модалке выбора (M1d, «Перенести в папку»): tile с индикатором, выбранная — в цвете
 *  своей папки, как выбранный пункт «В закладки». */
function FolderRadioCard({ folder, isChecked, description }: Props) {
  return (
    <Radio.Card
      value={folder.id}
      variant="tile"
      radius="md"
      p="sm"
      style={isChecked ? getBookmarkFolderTintStyle(folder.color) : undefined}
    >
      <Group gap="sm" wrap="nowrap">
        <Radio.Indicator variant="outline" color={folder.color} />
        <FolderGlyph folder={folder} size={18} />
        <Stack gap={2} miw={0}>
          <Text fz="sm" lh="tight" truncate>
            {folder.name}
          </Text>
          {description && (
            <Text fz={12} c="dimmed" lh="tight">
              {description}
            </Text>
          )}
        </Stack>
      </Group>
    </Radio.Card>
  );
}

export default FolderRadioCard;
