import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import GroupedList from '@/shared/ui/GroupedList';
import { getMappingText } from '../lib';
import type { SiteFolder } from '../models';

type Props = {
  folders: SiteFolder[];
};

/** M3 — сводка «папка сайта → наша» над списком; в строках тайтлов бейджа нет. */
function FolderMappingSummary({ folders }: Props) {
  return (
    <GroupedList label="Папки">
      {folders.map((folder) => (
        <GroupedList.Row
          key={folder.id}
          icon={<FolderGlyph folder={folder.target} size={24} />}
          title={folder.name}
          description={`→ ${getMappingText(folder)}`}
        />
      ))}
    </GroupedList>
  );
}

export default FolderMappingSummary;
