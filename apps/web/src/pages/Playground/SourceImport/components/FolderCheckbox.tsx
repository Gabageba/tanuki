import { Checkbox, Group, Stack, Text } from '@mantine/core';
import type { ImportSelection } from '../hooks/useImportSelection';
import { getMappingText } from '../lib';
import { MAPPING_VIEW, type SiteFolder, type TitlesConfig } from '../models';

type Props = {
  folder: SiteFolder;
  selection: ImportSelection;
  config: TitlesConfig;
};

/** Папка сайта с чекбоксом «все»: название, «12 из 40», в M2 — куда она ляжет у вас. */
function FolderCheckbox({ folder, selection, config }: Props) {
  const count = selection.countInFolder(folder);
  const total = folder.items.length;

  return (
    <Group gap="sm" wrap="nowrap" align="flex-start" flex={1} miw={0}>
      <Checkbox
        aria-label={`Все в «${folder.name}»`}
        checked={count === total}
        indeterminate={count > 0 && count < total}
        onChange={() => selection.toggleFolder(folder)}
        onClick={(event) => event.stopPropagation()}
        mt={2}
      />
      <Stack gap={2} flex={1} miw={0}>
        <Group gap="xs" wrap="nowrap" justify="space-between" align="flex-start">
          <Text fz="sm" fw={500} lh="tight" style={{ overflowWrap: 'anywhere' }}>
            {folder.name}
          </Text>
          <Text ff="monospace" fz={12} c="dimmed" flex="none" style={{ whiteSpace: 'nowrap' }}>
            {count} из {total}
          </Text>
        </Group>
        {config.mapping === MAPPING_VIEW.GROUP_HEADER && (
          <Text fz={12} c="dimmed" lh="tight">
            → {getMappingText(folder)}
          </Text>
        )}
      </Stack>
    </Group>
  );
}

export default FolderCheckbox;
