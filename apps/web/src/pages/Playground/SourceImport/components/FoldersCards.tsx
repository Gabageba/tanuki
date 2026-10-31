import { Checkbox, Group, Stack, Text } from '@mantine/core';
import type { FolderSelection } from '../hooks/useFolderSelection';
import { countFresh, getFreshText, getMappingText } from '../lib';
import type { SiteFolder } from '../models';

type Props = {
  folders: SiteFolder[];
  selection: FolderSelection;
};

/** F4 — карточка на папку: нажимается целиком, внутри название и «24 тайтла · → в „Читаю“». */
function FoldersCards({ folders, selection }: Props) {
  return (
    <Stack gap="xs">
      {folders.map((folder) => {
        const isEmpty = countFresh(folder) === 0;

        return (
          <Checkbox.Card
            key={folder.id}
            radius="md"
            p="sm"
            checked={selection.isSelected(folder)}
            onChange={() => selection.toggle(folder)}
            disabled={isEmpty}
            opacity={isEmpty ? 0.5 : undefined}
          >
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <Checkbox.Indicator mt={2} disabled={isEmpty} />
              <Stack gap={2} miw={0}>
                <Text fz="sm" fw={500} lh="tight" style={{ overflowWrap: 'anywhere' }}>
                  {folder.name}
                </Text>
                <Text fz={12} c="dimmed" lh="tight">
                  {getFreshText(folder)} · → {getMappingText(folder)}
                </Text>
              </Stack>
            </Group>
          </Checkbox.Card>
        );
      })}
    </Stack>
  );
}

export default FoldersCards;
