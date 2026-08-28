import { useState } from 'react';
import { Affix, ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BroomIcon } from '@phosphor-icons/react';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

function DevCacheResetButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await apiFetch('/cache', { method: 'DELETE' });
      notifications.show({ color: 'green', title: 'Кеш сброшен', message: 'Redis очищен' });
      window.location.reload();
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : 'Не удалось сбросить кеш';
      notifications.show({ color: 'red', title: 'Ошибка', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Affix position={{ bottom: 80, right: 20 }}>
      <Tooltip label="Сбросить кеш Redis">
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color="red"
          loading={isLoading}
          onClick={handleClick}
        >
          <BroomIcon size={20} />
        </ActionIcon>
      </Tooltip>
    </Affix>
  );
}

export default DevCacheResetButton;
