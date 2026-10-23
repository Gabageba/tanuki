import { Stack } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import type { FolderSelection } from '../hooks/useFolderSelection';
import { countFresh, getMappingGroupTitle } from '../lib';
import { FOLDER_MAPPING, type SiteFolder } from '../models';
import FolderCount from './FolderCount';
import SiteFolderCheckbox from './SiteFolderCheckbox';

type Props = {
  folders: SiteFolder[];
  selection: FolderSelection;
};

/** F3 — папки сайта собраны в блоки по судьбе: встроенные, ваши, создадутся, не поместятся. */
function FoldersByDestination({ folders, selection }: Props) {
  return (
    <Stack gap="md">
      {Object.values(FOLDER_MAPPING).map((mapping) => (
        <GroupedList key={mapping} label={getMappingGroupTitle(mapping)}>
          {folders
            .filter((folder) => folder.mapping === mapping)
            .map((folder) => (
              <GroupedList.Row
                key={folder.id}
                icon={<SiteFolderCheckbox folder={folder} selection={selection} />}
                title={folder.name}
                action={<FolderCount folder={folder} />}
                isActionCompact
                disabled={countFresh(folder) === 0}
              />
            ))}
        </GroupedList>
      ))}
    </Stack>
  );
}

export default FoldersByDestination;
