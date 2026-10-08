import { useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import type { FolderChoice } from '../models';

/** Папка тайтла в макете: выбор переносит сразу, «Убрать» — без модалки, с «Вернуть» в тосте. */
function useMockFolderChoice(initialFolderId: string | null): FolderChoice {
  const [folderId, setFolderId] = useState(initialFolderId);

  const remove = () => {
    const previous = folderId;
    const id = notifications.show({
      autoClose: 6000,
      message: (
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Text fz="sm">Убрано из закладок</Text>
          <Button
            size="compact-sm"
            variant="subtle"
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => {
              setFolderId(previous);
              notifications.hide(id);
            }}
          >
            Вернуть
          </Button>
        </Group>
      ),
    });
    setFolderId(null);
  };

  return { folderId, select: setFolderId, remove };
}

export default useMockFolderChoice;
