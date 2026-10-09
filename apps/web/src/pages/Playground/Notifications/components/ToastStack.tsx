import { useState } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { BellIcon, TrashIcon } from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { MAX_TOASTS, TOAST_ACTION, TOAST_TONE, type MockNotification } from '../models';
import { MOCK_TOAST_ITEMS } from '../mocks';
import ToastCard from './ToastCard';

type Toast = { key: number; item: MockNotification };

/** Q1: стопка тостов, на экране не больше `MAX_TOASTS` — когда приходит следующий, самый старый
 *  закрывается. T1 (весь тост кликабелен) и D1 (тон по категории). */
function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>(
    MOCK_TOAST_ITEMS.slice(0, MAX_TOASTS).map((item, index) => ({ key: index, item })),
  );
  const [counter, setCounter] = useState(MOCK_TOAST_ITEMS.length);

  const push = () => {
    const item = MOCK_TOAST_ITEMS[counter % MOCK_TOAST_ITEMS.length];
    if (!item) {
      return;
    }
    setToasts((prev) => [...prev, { key: counter, item }].slice(-MAX_TOASTS));
    setCounter((prev) => prev + 1);
  };

  return (
    <Stack gap="md">
      <SandboxOnly>
        <Group gap="xs">
          <Button leftSection={<BellIcon />} onClick={push}>
            Прислать событие
          </Button>
          <Button variant="default" leftSection={<TrashIcon />} onClick={() => setToasts([])}>
            Закрыть все тосты
          </Button>
        </Group>
      </SandboxOnly>
      <Stack gap="xs" align="flex-end" mih={MAX_TOASTS * 70}>
        {toasts.map(({ key, item }) => (
          <ToastCard
            key={key}
            item={item}
            action={TOAST_ACTION.WHOLE}
            tone={TOAST_TONE.BY_CATEGORY}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export default ToastStack;
