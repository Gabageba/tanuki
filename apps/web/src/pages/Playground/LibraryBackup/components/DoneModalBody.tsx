import { Button, Stack, Text } from '@mantine/core';
import { BookmarksSimpleIcon, XIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { formatBackupOwner } from '../lib';
import { DONE_VIEW, type DoneView, type RestoreResult } from '../models';
import DoneRows from './DoneRows';
import DoneShort from './DoneShort';

type Props = {
  view: DoneView;
  result: RestoreResult;
  onClose?: () => void;
};

/** Тело шага «Готово»: итог в выбранном виде и кнопки. */
function DoneModalBody({ view, result, onClose }: Props) {
  return (
    <Stack gap="md">
      {view === DONE_VIEW.SHORT ? (
        <DoneShort result={result} />
      ) : (
        <>
          <Text fz="sm" style={{ overflowWrap: 'anywhere' }}>
            {formatBackupOwner(result.username, result.exportedAt)} — восстановлена.
          </Text>
          <DoneRows result={result} isBySource={view === DONE_VIEW.BY_SOURCE} />
        </>
      )}
      <ModalButtonsLayout>
        <Button variant="default" leftSection={<XIcon />} onClick={onClose}>
          Закрыть
        </Button>
        <Button leftSection={<BookmarksSimpleIcon />}>Открыть закладки</Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default DoneModalBody;
