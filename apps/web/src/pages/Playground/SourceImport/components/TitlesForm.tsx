import { Button, Checkbox, Divider, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { ArrowRightIcon, CloudArrowDownIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import useImportSelection from '../hooks/useImportSelection';
import { hasProgressDiff } from '../lib';
import {
  COUNTER_VIEW,
  ITEM_STATE,
  LIST_HEIGHT,
  LIST_VIEW,
  MAPPING_VIEW,
  type SiteFolder,
  type TitlesConfig,
} from '../models';
import FolderMappingSummary from './FolderMappingSummary';
import ListAccordion from './ListAccordion';
import ListDrill from './ListDrill';
import ListFlat from './ListFlat';
import ListFrames from './ListFrames';
import ListSubheaders from './ListSubheaders';
import NothingNewNote from './NothingNewNote';

type Props = {
  folders: SiteFolder[];
  config: TitlesConfig;
  isPhone: boolean;
  openFolder: SiteFolder | null;
  onOpenFolder: (folder: SiteFolder) => void;
};

/** Тело шага «Тайтлы»: счётчик по оси K, список по оси L, кнопки. Живое — чекбоксы работают,
 *  «Далее» сменяется на «Импорт», когда среди выбранного не остаётся конфликтов. */
function TitlesForm({ folders, config, isPhone, openFolder, onOpenFolder }: Props) {
  const selection = useImportSelection(folders);
  const count = selection.selected.size;
  const isAll = count === selection.total;
  const isFlat = config.list === LIST_VIEW.FLAT;

  const hasQuestions = folders.some((folder) =>
    folder.items.some(
      (item) =>
        selection.isSelected(item.id) &&
        (item.state === ITEM_STATE.OTHER_FOLDER || hasProgressDiff(item)),
    ),
  );

  const allCheckbox = (label: string) => (
    <Checkbox
      label={label}
      checked={isAll}
      indeterminate={count > 0 && !isAll}
      onChange={selection.toggleAll}
    />
  );

  const getList = () => {
    const props = { folders, selection, config };
    switch (config.list) {
      case LIST_VIEW.FLAT:
        return <ListFlat folders={folders} selection={selection} />;
      case LIST_VIEW.FRAMES:
        return <ListFrames {...props} />;
      case LIST_VIEW.ACCORDION:
        return <ListAccordion {...props} />;
      case LIST_VIEW.SUBHEADERS:
        return <ListSubheaders {...props} />;
      case LIST_VIEW.DRILL:
        return <ListDrill {...props} openFolder={openFolder} onOpenFolder={onOpenFolder} />;
    }
  };

  const confirm = (
    <Button
      leftSection={hasQuestions ? <ArrowRightIcon /> : <CloudArrowDownIcon />}
      rightSection={
        config.counter === COUNTER_VIEW.BUTTON && (
          <Text ff="monospace" inherit>
            {count}
          </Text>
        )
      }
      disabled={count === 0}
    >
      {hasQuestions ? 'Далее' : 'Импорт'}
    </Button>
  );

  return (
    <Stack gap="sm">
      <NothingNewNote folders={folders} />
      {config.counter === COUNTER_VIEW.TOP && allCheckbox(`Выбрано ${count} из ${selection.total}`)}
      {config.counter === COUNTER_VIEW.BUTTON && allCheckbox('Выбрать всё')}
      {config.counter !== COUNTER_VIEW.BOTTOM && <Divider />}
      <ScrollArea.Autosize
        mah={isPhone ? LIST_HEIGHT - 60 : LIST_HEIGHT}
        type="auto"
        scrollbars="y"
        offsetScrollbars
        // Содержимое ScrollArea по умолчанию растёт по самой длинной строке (`display: table`,
        // `min-width: min-content`) — тогда обрезка названия в R1 не срабатывает.
        styles={{ content: { display: 'block', minWidth: 0 } }}
      >
        <Stack gap="sm">
          {config.mapping === MAPPING_VIEW.SUMMARY && !openFolder && (
            <FolderMappingSummary folders={folders} />
          )}
          {getList()}
        </Stack>
      </ScrollArea.Autosize>
      {isFlat && (
        <>
          <Divider />
          <Text fz={13} c="dimmed">
            Импорт не перезаписывает прогресс чтения, отметки и статусы уже добавленных тайтлов.
          </Text>
        </>
      )}
      {config.counter === COUNTER_VIEW.BOTTOM ? (
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Checkbox
            label={
              <Text ff="monospace" inherit style={{ whiteSpace: 'nowrap' }}>
                {count} из {selection.total}
              </Text>
            }
            checked={isAll}
            indeterminate={count > 0 && !isAll}
            onChange={selection.toggleAll}
          />
          <Group gap="xs" wrap="nowrap">
            <Button variant="default">Отмена</Button>
            {confirm}
          </Group>
        </Group>
      ) : (
        <ModalButtonsLayout>
          <Button variant="default">Отмена</Button>
          {confirm}
        </ModalButtonsLayout>
      )}
    </Stack>
  );
}

export default TitlesForm;
