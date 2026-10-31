import { Group } from '@mantine/core';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import GroupedList from '@/shared/ui/GroupedList';
import type { FolderSelection } from '../hooks/useFolderSelection';
import { countFresh, getMappingText } from '../lib';
import { SOURCE_TITLE, type SiteFolder } from '../models';
import FolderCount from './FolderCount';
import SiteFolderCheckbox from './SiteFolderCheckbox';

type Props = {
  folders: SiteFolder[];
  selection: FolderSelection;
};

/** F1 — рамка `GroupedList`: чекбокс, иконка нашей папки, название папки сайта, куда ляжет. */
function FoldersGroupedList({ folders, selection }: Props) {
  return (
    <GroupedList label={`Папки на ${SOURCE_TITLE}`}>
      {folders.map((folder) => (
        <GroupedList.Row
          key={folder.id}
          icon={
            <Group gap="sm" wrap="nowrap">
              <SiteFolderCheckbox folder={folder} selection={selection} />
              <FolderGlyph folder={folder.target} size={24} />
            </Group>
          }
          title={folder.name}
          description={`→ ${getMappingText(folder)}`}
          action={<FolderCount folder={folder} />}
          isActionCompact
          disabled={countFresh(folder) === 0}
        />
      ))}
    </GroupedList>
  );
}

export default FoldersGroupedList;
