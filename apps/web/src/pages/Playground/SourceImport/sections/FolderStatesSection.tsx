import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import FoldersStep from '../components/FoldersStep';
import { LIBRARY_EMPTY, LIBRARY_FOLDERS_NOTHING_NEW, LIBRARY_FOLDERS_REPEAT } from '../mocks';
import { FOLDERS_VIEW } from '../models';

/** S — крайние случаи шага «Папки» на F1. */
function FolderStatesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="Состояния"
        description="Крайние случаи шага «Папки» на F1. «Ничего не выбрано» — снимите общий чекбокс в любом варианте: «Импорт» выключится."
      />
      <DemoSection
        code="S"
        title="Повторный импорт, нового нет, закладок нет"
        description="Повторный импорт: у папок «9 новых из 24», папка без нового приглушена, её чекбокс выключен. Нового нет нигде — заметка над списком, всё снято, «Импорт» выключен. Пустой сайт — EmptyState вместо списка."
      >
        <Group align="flex-start" gap="lg">
          <CaptionedFrame caption="Повторный импорт">
            <FoldersStep folders={LIBRARY_FOLDERS_REPEAT} view={FOLDERS_VIEW.LIST} />
          </CaptionedFrame>
          <CaptionedFrame caption="Нового нет">
            <FoldersStep folders={LIBRARY_FOLDERS_NOTHING_NEW} view={FOLDERS_VIEW.LIST} />
          </CaptionedFrame>
          <CaptionedFrame caption="На сайте закладок нет">
            <FoldersStep folders={LIBRARY_EMPTY} view={FOLDERS_VIEW.LIST} />
          </CaptionedFrame>
        </Group>
      </DemoSection>
    </Stack>
  );
}

export default FolderStatesSection;
