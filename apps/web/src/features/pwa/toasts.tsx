import type { TFunction } from 'i18next';
import { Toasts } from '@/shared/lib/toasts/store';
import { TOAST_KIND } from '@/shared/lib/toasts/models';
import { getPwaOffer } from './lib';
import type { PwaOffer } from './models';
import PwaOfferMessage from './PwaOfferMessage';

type Params = {
  offer: PwaOffer;
  t: TFunction;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** Только крестик означает отказ; вытеснение возвращает актуальное предложение в очередь. */
export const showPwaOffer = ({ offer, t, onConfirm, onDismiss }: Params) => {
  const { title, description, icon } = getPwaOffer(offer, t);
  const id = `pwa-${offer}`;
  Toasts.show({
    id,
    title,
    description,
    icon,
    kind: TOAST_KIND.PWA,
    global: true,
    readerAllowed: false,
    onDismiss,
    actions: <PwaOfferMessage offer={offer} onConfirm={() => Toasts.act(id, onConfirm)} />,
  });
  return () => Toasts.close(id);
};
