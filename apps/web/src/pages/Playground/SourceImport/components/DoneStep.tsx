import { Button, Loader, Stack, Text } from '@mantine/core';
import {
  BookmarksSimpleIcon,
  CheckCircleIcon,
  FolderSimpleIcon,
  MapPinIcon,
  XIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import NewCount from '../../LibraryBackup/components/NewCount';
import { formatCount } from '../../LibraryBackup/lib';
import { DONE_VIEW, SOURCE_TITLE, type DoneView } from '../models';

type Props = {
  view: DoneView;
  isPhone?: boolean;
};

const PENDING_MARKS = 112;

/** Шаг «Готово»: строки, как D1 копии. Отметки ещё достраиваются в фоне — как это сказать, решает
 *  ось G. */
function DoneStep({ view, isPhone = false }: Props) {
  return (
    <ModalFrame
      title="Закладки импортированы"
      tone={MODAL_TONE.SUCCESS}
      icon={CheckCircleIcon}
      isPhone={isPhone}
    >
      <Stack gap="md">
        <Text lh="tight" fz="sm">
          Закладки с {SOURCE_TITLE} — в вашей библиотеке.
        </Text>
        <GroupedList label="Что изменилось">
          <GroupedList.Row
            icon={<BookmarksSimpleIcon />}
            title="Закладки"
            isActionCompact
            action={<NewCount value={87} />}
            description="5 — как ещё один источник · 7 перенесены в папки, как на сайте"
          />
          <GroupedList.Row
            icon={<FolderSimpleIcon />}
            title="Папки"
            isActionCompact
            action={<NewCount value={1} />}
            description="1 совпала по имени · 2 не поместились в лимит — их тайтлы в «В планах»"
          />
          {view === DONE_VIEW.ROW && (
            <GroupedList.Row
              icon={<MapPinIcon />}
              title="Где остановился"
              isActionCompact
              action={<NewCount value={PENDING_MARKS} />}
              description="Появятся в течение нескольких минут — пришлём уведомление"
            />
          )}
          {view === DONE_VIEW.LOADER && (
            <GroupedList.Row
              icon={<Loader size={20} />}
              title="Где остановился — переносим"
              isActionCompact
              action={
                <Text ff="monospace" fz="sm" c="dimmed">
                  {formatCount(PENDING_MARKS)}
                </Text>
              }
              description="Можно закрыть окно — пришлём уведомление, когда закончим"
            />
          )}
        </GroupedList>
        {view === DONE_VIEW.NOTE && (
          <Text fz={13} c="dimmed" lh="tight">
            Где остановился: {formatCount(PENDING_MARKS)} отметок появятся в течение нескольких
            минут — пришлём уведомление.
          </Text>
        )}
        <ModalButtonsLayout>
          <Button variant="default" leftSection={<XIcon />}>
            Закрыть
          </Button>
          <Button leftSection={<BookmarksSimpleIcon />}>Открыть закладки</Button>
        </ModalButtonsLayout>
      </Stack>
    </ModalFrame>
  );
}

export default DoneStep;
