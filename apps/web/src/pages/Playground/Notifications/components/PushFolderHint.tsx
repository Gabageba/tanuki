import { useState } from 'react';
import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { BellRingingIcon, BookmarkSimpleIcon, ClockIcon, FolderIcon } from '@phosphor-icons/react';
import { PUSH_OFFER_STATE, type PushOfferState } from '../models';

type Props = {
  state: PushOfferState;
};

/** K3: форма «В закладки» с выбором папки; под выбором — строка с предложением push. */
function PushFolderHint({ state }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <Stack gap="xs" maw={360}>
      <Select
        data={['Читаю', 'В планах', 'Прочитано', 'Заброшено']}
        value="Читаю"
        aria-label="Папка"
        leftSection={<FolderIcon size={16} />}
        allowDeselect={false}
      />
      {!isDismissed && (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <BellRingingIcon size={16} />
          {state === PUSH_OFFER_STATE.DENIED ? (
            <Text fz={12} c="dimmed">
              Браузер запретил уведомления — разрешите их в настройках браузера
            </Text>
          ) : (
            <Text fz={12}>Присылать push о новых главах из этой папки?</Text>
          )}
        </Group>
      )}
      {!isDismissed && (
        <Group gap="xs">
          {state === PUSH_OFFER_STATE.ASK && (
            <Button size="compact-sm" variant="light" leftSection={<BellRingingIcon />}>
              Включить push-уведомления
            </Button>
          )}
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            leftSection={<ClockIcon />}
            onClick={() => setIsDismissed(true)}
          >
            {state === PUSH_OFFER_STATE.ASK ? 'Не сейчас' : 'Понятно'}
          </Button>
        </Group>
      )}
      <Button leftSection={<BookmarkSimpleIcon />}>Добавить в закладки</Button>
    </Stack>
  );
}

export default PushFolderHint;
