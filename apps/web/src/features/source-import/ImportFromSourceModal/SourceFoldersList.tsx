import { Checkbox, Group } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import type { SourceImportFolder } from '@tanuki/contracts';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import GroupedList from '@/shared/ui/GroupedList';
import { getFolderTargetText, getTargetFolderGlyph, isSelectableFolder } from './lib';
import type { ImportChoices } from './models';
import SourceFolderCount from './SourceFolderCount';

type Props = {
  sourceTitle: string;
  folders: SourceImportFolder[];
  form: UseFormReturnType<ImportChoices>;
};

/**
 * Папки сайта рамкой: чекбокс, иконка нашей папки, название папки сайта, под ним — куда она
 * ляжет, справа — сколько. Папка без нового приглушена, её чекбокс выключен.
 */
function SourceFoldersList({ sourceTitle, folders, form }: Props) {
  const { t } = useTranslation();
  const { folderIds } = form.getValues();

  const toggle = (folderId: string) =>
    form.setFieldValue(
      'folderIds',
      folderIds.includes(folderId)
        ? folderIds.filter((id) => id !== folderId)
        : [...folderIds, folderId],
    );

  return (
    <GroupedList label={t('foldersOn', { source: sourceTitle })}>
      {folders.map((folder) => (
        <GroupedList.Row
          key={folder.id}
          icon={
            <Group gap="sm" wrap="nowrap">
              <Checkbox
                aria-label={folder.name}
                checked={folderIds.includes(folder.id)}
                disabled={!isSelectableFolder(folder)}
                onChange={() => toggle(folder.id)}
              />
              <FolderGlyph folder={getTargetFolderGlyph(folder)} size={24} />
            </Group>
          }
          title={folder.name}
          description={getFolderTargetText(folder, t)}
          action={<SourceFolderCount folder={folder} />}
          isActionCompact
          disabled={!isSelectableFolder(folder)}
        />
      ))}
    </GroupedList>
  );
}

export default SourceFoldersList;
