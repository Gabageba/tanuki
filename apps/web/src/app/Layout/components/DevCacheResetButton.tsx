import { useState } from 'react';
import { Affix, ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BroomIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiRequestError } from '@/shared/api/client';

function DevCacheResetButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await apiFetch('/cache', { method: 'DELETE' });
      notifications.show({
        color: 'green',
        title: t('cacheReset'),
        message: t('redisCleared'),
      });
      window.location.reload();
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : t('failedToResetCache');
      notifications.show({ color: 'red', title: t('error'), message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Affix position={{ bottom: 80, right: 20 }}>
      <Tooltip label={t('resetRedisCache')}>
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
