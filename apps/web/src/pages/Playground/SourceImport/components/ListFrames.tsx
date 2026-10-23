import { Divider, Paper, Stack } from '@mantine/core';
import type { ImportSelection } from '../hooks/useImportSelection';
import type { SiteFolder, TitlesConfig } from '../models';
import FolderCheckbox from './FolderCheckbox';
import FolderItems from './FolderItems';

type Props = {
  folders: SiteFolder[];
  selection: ImportSelection;
  config: TitlesConfig;
};

/** L1 — рамка на каждую папку сайта: в шапке чекбокс «все», под ней тайтлы. */
function ListFrames({ folders, selection, config }: Props) {
  return (
    <Stack gap="sm">
      {folders.map((folder) => (
        <Paper key={folder.id} withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Stack px="md" py="xs" bg="var(--mantine-color-default-hover)">
            <FolderCheckbox folder={folder} selection={selection} config={config} />
          </Stack>
          <Divider />
          <FolderItems folder={folder} selection={selection} config={config} />
        </Paper>
      ))}
    </Stack>
  );
}

export default ListFrames;
