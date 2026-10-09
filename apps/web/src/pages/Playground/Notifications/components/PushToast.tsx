import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { BellRingingIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import type { PushOfferState } from '../models';
import PushOfferActions from './PushOfferActions';
import ToastShell from './ToastShell';

type Props = {
  state: PushOfferState;
};

/** K2: предложение тостом с действием сразу после добавления в закладки. */
function PushToast({ state }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <ToastShell icon={<BellRingingIcon size={18} />} color={PRIMARY_COLOR}>
      <Stack gap="xs">
        <Text fz="sm" fw={500}>
          Хотите узнавать о новых главах?
        </Text>
        <PushOfferActions state={state} onDismiss={() => setIsDismissed(true)} size="xs" />
      </Stack>
    </ToastShell>
  );
}

export default PushToast;
