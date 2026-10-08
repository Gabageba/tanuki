import { Group, Radio, Stack, Text } from '@mantine/core';
import { getFolderTintStyle } from '../lib';
import { MERGE_VARIANT, type MergeVariant, type ResolvedFolder } from '../models';
import FolderChoiceIcon from './FolderChoiceIcon';
import FolderGlyph from './FolderGlyph';

type Props = {
  folder: ResolvedFolder;
  sourceTitle: string;
  isChecked: boolean;
  variant: MergeVariant;
};

/**
 * Карточка папки в модалке склейки. M1 — tile, иконка цвета папки на акцентной подложке;
 * M1a — tile, иконка красится вместе с карточкой; M1b — без подложки, только рамка; M1c — tile,
 * иконка цвета папки, у выбранной — в плашке, как метка K2; M1d — выбранная карточка в цвете
 * папки, как выбранный пункт S4.
 */
function MergeFolderCard({ folder, sourceTitle, isChecked, variant }: Props) {
  const isTile = variant !== MERGE_VARIANT.RADIO_CARDS_BORDER;
  // В M1b и M1c название обычным цветом — акцент только у рамки, индикатора и подложки.
  const isNameNeutral =
    variant === MERGE_VARIANT.RADIO_CARDS_BORDER || variant === MERGE_VARIANT.RADIO_CARDS_PLATE;

  const isFolderTint = variant === MERGE_VARIANT.RADIO_CARDS_FOLDER_TINT;

  const getIcon = () => {
    if (variant === MERGE_VARIANT.RADIO_CARDS_INHERIT) {
      return (
        <FolderGlyph
          folder={folder}
          size={18}
          color={isChecked ? 'currentColor' : 'var(--mantine-color-dimmed)'}
        />
      );
    }
    if (variant === MERGE_VARIANT.RADIO_CARDS_PLATE) {
      return <FolderChoiceIcon folder={folder} isSelected={isChecked} size={28} iconSize={16} />;
    }
    return <FolderGlyph folder={folder} size={18} />;
  };

  const getCardStyle = () => {
    if (!isChecked) return undefined;
    if (isFolderTint) return getFolderTintStyle(folder.color);
    if (!isTile) return { borderColor: 'var(--mantine-primary-color-filled)' };
    return undefined;
  };

  return (
    <Radio.Card
      value={folder.id}
      variant={isTile ? 'tile' : undefined}
      radius="md"
      p="sm"
      style={getCardStyle()}
    >
      <Group gap="sm" wrap="nowrap">
        <Radio.Indicator variant="outline" color={isFolderTint ? folder.color : undefined} />
        {getIcon()}
        <Stack gap={2} miw={0}>
          <Text
            fz="sm"
            lh="tight"
            truncate
            c={isNameNeutral ? 'var(--mantine-color-text)' : undefined}
          >
            {folder.name}
          </Text>
          <Text fz={12} c="dimmed" lh="tight">
            Так лежит на {sourceTitle}
          </Text>
        </Stack>
      </Group>
    </Radio.Card>
  );
}

export default MergeFolderCard;
