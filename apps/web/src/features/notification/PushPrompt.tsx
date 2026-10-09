import { Alert, Group, Stack, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { BellRingingIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import usePushDevice from '@/entities/notification/hooks/usePushDevice';
import { PUSH_DEVICE_STATE } from '@/entities/notification/models';
import { PUSH_OFFER_DISMISSED_STORAGE_KEY } from '@/entities/notification/push';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import PushPromptActions from './PushPromptActions';

/** Иконка 20 px и зазор `xs` (8 px): описание встаёт ровно под текст заголовка. */
const ICON_OFFSET = 28;

/**
 * Предложение включить push — первая строка ленты. Показывается, пока push на устройстве не
 * включён, а на инстансе и в браузере его можно включить; «Не сейчас» запоминается на устройстве.
 */
function PushPrompt() {
  const { t } = useTranslation();
  const { isAvailable, isPending, isChanging, state, enable } = usePushDevice();
  const [isDismissed, setIsDismissed] = useLocalStorage({
    key: PUSH_OFFER_DISMISSED_STORAGE_KEY,
    defaultValue: false,
    getInitialValueInEffect: false,
  });

  const canOffer =
    state === PUSH_DEVICE_STATE.OFF ||
    state === PUSH_DEVICE_STATE.EXPIRED ||
    state === PUSH_DEVICE_STATE.DENIED;
  if (!isAvailable || isPending || isDismissed || !canOffer) return null;

  return (
    <Alert
      variant="muted"
      color={PRIMARY_COLOR}
      title={
        <Group gap="xs" wrap="nowrap">
          <BellRingingIcon size={20} />
          {t('getNewChaptersFirst')}
        </Group>
      }
    >
      <Stack gap="sm">
        {state !== PUSH_DEVICE_STATE.DENIED && (
          <Text fz="xs" lh="tight" pl={ICON_OFFSET}>
            {t('pushArrivesEvenWhenAppClosed')}
          </Text>
        )}
        <PushPromptActions
          state={state}
          isLoading={isChanging}
          onEnable={() => enable()}
          onDismiss={() => setIsDismissed(true)}
        />
      </Stack>
    </Alert>
  );
}

export default PushPrompt;
