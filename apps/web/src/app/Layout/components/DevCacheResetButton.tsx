import { useState } from 'react';
import { Affix, ActionIcon, Tooltip } from '@mantine/core';
import { BroomIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Toasts } from '@/shared/lib/toasts/store';
import { FEEDBACK_TONE } from '@/shared/lib/feedback';
import { apiFetch } from '@/shared/api/client';
import { showToastError } from '@/shared/api/toastErrors';

function DevCacheResetButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await apiFetch('/cache', { method: 'DELETE' });
      Toasts.show({
        tone: FEEDBACK_TONE.SUCCESS,
        title: t('cacheReset'),
        description: t('redisCleared'),
      });
      window.location.reload();
    } catch (error) {
      showToastError(error, t('failedToResetCache'));
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
