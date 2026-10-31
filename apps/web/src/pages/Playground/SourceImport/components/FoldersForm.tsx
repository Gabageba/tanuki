import { Button, Checkbox, Divider, ScrollArea, Stack } from '@mantine/core';
import { ArrowRightIcon, CloudArrowDownIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import useFolderSelection from '../hooks/useFolderSelection';
import { getTitlesCountText, hasFolderConflicts, pluralize } from '../lib';
import { FOLDERS_VIEW, LIST_HEIGHT, type FoldersView, type SiteFolder } from '../models';
import FoldersBadgeList from './FoldersBadgeList';
import FoldersByDestination from './FoldersByDestination';
import FoldersCards from './FoldersCards';
import FoldersGroupedList from './FoldersGroupedList';
import NoNewFoldersNote from './NoNewFoldersNote';

type Props = {
  folders: SiteFolder[];
  view: FoldersView;
  isPhone: boolean;
};

/** Тело шага «Папки»: общий чекбокс со счётчиком, список по оси F, кнопки. Живое — «Далее»
 *  сменяется на «Импорт», когда в выбранных папках не остаётся конфликтов. */
function FoldersForm({ folders, view, isPhone }: Props) {
  const selection = useFolderSelection(folders);
  const { folderCount, titleCount, isAll } = selection;
  const hasQuestions = folders.some(
    (folder) => selection.isSelected(folder) && hasFolderConflicts(folder),
  );

  const getList = () => {
    switch (view) {
      case FOLDERS_VIEW.LIST:
        return <FoldersGroupedList folders={folders} selection={selection} />;
      case FOLDERS_VIEW.BADGE:
        return <FoldersBadgeList folders={folders} selection={selection} />;
      case FOLDERS_VIEW.DESTINATION:
        return <FoldersByDestination folders={folders} selection={selection} />;
      case FOLDERS_VIEW.CARDS:
        return <FoldersCards folders={folders} selection={selection} />;
    }
  };

  return (
    <Stack gap="sm">
      <NoNewFoldersNote folders={folders} />
      <Checkbox
        label={`Выбрано: ${folderCount} ${pluralize(folderCount, 'папка', 'папки', 'папок')}, ${getTitlesCountText(titleCount)}`}
        checked={isAll}
        indeterminate={folderCount > 0 && !isAll}
        disabled={!selection.hasSelectable}
        onChange={selection.toggleAll}
      />
      <Divider />
      <ScrollArea.Autosize
        mah={isPhone ? LIST_HEIGHT - 60 : LIST_HEIGHT}
        type="auto"
        scrollbars="y"
        offsetScrollbars
        styles={{ content: { display: 'block', minWidth: 0 } }}
      >
        {getList()}
      </ScrollArea.Autosize>
      <ModalButtonsLayout>
        <Button variant="default">Отмена</Button>
        <Button
          leftSection={hasQuestions ? <ArrowRightIcon /> : <CloudArrowDownIcon />}
          disabled={folderCount === 0}
        >
          {hasQuestions ? 'Далее' : 'Импорт'}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default FoldersForm;
