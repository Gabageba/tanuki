import { Alert, Group, Stack, Text } from '@mantine/core';
import { BellRingingIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { PUSH_OFFER_STATE, type PushOfferState } from '../models';
import PushOfferActions from './PushOfferActions';

type Props = {
  state: PushOfferState;
  onDismiss: () => void;
};

/** Иконка 20 px и зазор `xs` (8 px): описание встаёт ровно под текст заголовка. */
const ICON_OFFSET = 28;

/** M3: тот же `Alert variant="muted"`, что у M0 (цвета темы), но иконка стоит в строке заголовка, описание стоит под текстом заголовка, а кнопки идут от левого края. */
function PushBannerCard({ state, onDismiss }: Props) {
  return (
    <Alert
      variant="muted"
      color={PRIMARY_COLOR}
      title={
        <Group gap="xs" wrap="nowrap">
          <BellRingingIcon size={20} />
          Узнавайте о новых главах первыми
        </Group>
      }
    >
      <Stack gap="sm">
        {state === PUSH_OFFER_STATE.ASK && (
          <Text fz={12} pl={ICON_OFFSET}>
            Push придёт, даже когда приложение закрыто
          </Text>
        )}
        <PushOfferActions
          state={state}
          onDismiss={onDismiss}
          size="xs"
          enableLabel="Включить push"
          isFull
        />
      </Stack>
    </Alert>
  );
}

export default PushBannerCard;
