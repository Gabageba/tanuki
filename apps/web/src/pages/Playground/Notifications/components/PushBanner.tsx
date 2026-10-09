import { useState } from 'react';
import { Alert, Stack, Text } from '@mantine/core';
import { BellRingingIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { PUSH_LAYOUT, type PushLayout, type PushOfferState } from '../models';
import PushBannerCard from './PushBannerCard';
import PushBannerInline from './PushBannerInline';
import PushOfferActions from './PushOfferActions';

type Props = {
  state: PushOfferState;
  layout?: PushLayout;
};

/** K1 и K4: предложение плашкой — над контентом страницы или первой строкой ленты. `layout` — вид
 *  плашки (ось M). */
function PushBanner({ state, layout = PUSH_LAYOUT.CURRENT }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);
  const dismiss = () => setIsDismissed(true);

  if (isDismissed) {
    return null;
  }

  switch (layout) {
    case PUSH_LAYOUT.CURRENT:
      return (
        <Alert
          variant="muted"
          color={PRIMARY_COLOR}
          icon={<BellRingingIcon size={20} />}
          title="Узнавайте о новых главах первыми"
        >
          <Stack gap="sm">
            <Text fz="sm">
              Тайтл добавлен в папку со слежением. Push придёт, даже когда приложение закрыто.
            </Text>
            <PushOfferActions state={state} onDismiss={dismiss} />
          </Stack>
        </Alert>
      );
    case PUSH_LAYOUT.COMPACT:
      return (
        <Alert
          variant="muted"
          color={PRIMARY_COLOR}
          icon={<BellRingingIcon size={20} />}
          title="Узнавайте о новых главах первыми"
        >
          <Stack gap="xs">
            <Text fz={12}>Push придёт, даже когда приложение закрыто.</Text>
            <PushOfferActions state={state} onDismiss={dismiss} size="xs" enableLabel="Включить" />
          </Stack>
        </Alert>
      );
    case PUSH_LAYOUT.INLINE:
      return <PushBannerInline state={state} onDismiss={dismiss} />;
    case PUSH_LAYOUT.CARD:
      return <PushBannerCard state={state} onDismiss={dismiss} />;
  }
}

export default PushBanner;
