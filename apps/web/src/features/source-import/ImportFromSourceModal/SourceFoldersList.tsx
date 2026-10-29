import { Checkbox, Divider, Group, rem, ScrollArea, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import type { SourceImportPreview } from '@tanuki/contracts';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getFolderTargetText,
  getTargetFolderGlyph,
  isSelectableFolder,
  summarizeSelection,
} from './lib';
import { FOLDERS_LIST_MAX_HEIGHT, type ImportChoices } from './models';
import SourceFolderCount from './SourceFolderCount';

type Props = {
  sourceTitle: string;
  preview: SourceImportPreview;
  form: UseFormReturnType<ImportChoices>;
};

/**
 * Папки сайта рамкой: чекбокс, иконка нашей папки, название папки сайта, под ним — куда она
 * ляжет, справа — сколько. Папки без новых тайтлов и расхождений не показываются.
 */
function SourceFoldersList({ sourceTitle, preview, form }: Props) {
  const { t } = useTranslation();
  const { folderIds } = form.getValues();
  const folders = preview.folders.filter(isSelectableFolder);
  const summary = summarizeSelection(preview, folderIds);
  const isAll = folders.length > 0 && summary.folderCount === folders.length;

  if (folders.length === 0) return null;

  const toggle = (folderId: string) =>
    form.setFieldValue(
      'folderIds',
      folderIds.includes(folderId)
        ? folderIds.filter((id) => id !== folderId)
        : [...folderIds, folderId],
    );

  return (
    <Stack gap="sm">
      <Checkbox
        label={t('selectedCountFoldersCountTitles', {
          folders: summary.folderCount,
          count: summary.titleCount,
        })}
        checked={isAll}
        indeterminate={summary.folderCount > 0 && !isAll}
        error={form.errors.folderIds}
        onChange={() => form.setFieldValue('folderIds', isAll ? [] : folders.map(({ id }) => id))}
      />
      <Divider />
      <ScrollArea.Autosize
        mah={`min(${rem(FOLDERS_LIST_MAX_HEIGHT)}, 50dvh)`}
        type="auto"
        scrollbars="y"
        offsetScrollbars
        miw={0}
      >
        <GroupedList label={t('foldersOn', { source: sourceTitle })}>
          {folders.map((folder) => (
            <GroupedList.Row
              key={folder.id}
              icon={
                <Group gap="sm" wrap="nowrap">
                  <Checkbox
                    aria-label={folder.name}
                    checked={folderIds.includes(folder.id)}
                    onChange={() => toggle(folder.id)}
                  />
                  <FolderGlyph folder={getTargetFolderGlyph(folder)} size={24} />
                </Group>
              }
              title={folder.name}
              description={getFolderTargetText(folder, t)}
              action={<SourceFolderCount folder={folder} />}
              isActionCompact
            />
          ))}
        </GroupedList>
      </ScrollArea.Autosize>
    </Stack>
  );
}

export default SourceFoldersList;
