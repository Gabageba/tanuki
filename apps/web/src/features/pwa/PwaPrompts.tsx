import { useEffect, useState, useSyncExternalStore } from 'react';
import { useMatch } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  dismissInstallOffer,
  installApp,
  shouldOfferInstall,
  subscribeToInstall,
} from '@/shared/lib/appInstall/install';
import {
  applyUpdate,
  getWaitingWorker,
  isUpdateRequested,
  subscribeToUpdate,
} from '@/shared/lib/serviceWorker';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { PWA_OFFER } from './models';
import { showPwaOffer } from './toasts';

/** Предложения не прерывают чтение: оба тоста ждут выхода из читалки. */
function PwaPrompts() {
  const { t } = useTranslation();
  const isReader = Boolean(useMatch(ROUTE_PATHS.READER));
  const worker = useSyncExternalStore(subscribeToUpdate, getWaitingWorker);
  const isUpdating = useSyncExternalStore(subscribeToUpdate, isUpdateRequested);
  const canOfferInstall = useSyncExternalStore(subscribeToInstall, shouldOfferInstall);
  const [dismissedWorker, setDismissedWorker] = useState<ServiceWorker | null>(null);
  const canOfferUpdate = worker !== null && worker !== dismissedWorker && !isReader;

  useEffect(() => {
    if (!canOfferUpdate) return;
    return showPwaOffer({
      offer: PWA_OFFER.UPDATE,
      t,
      onConfirm: () => {
        setDismissedWorker(worker);
        void applyUpdate();
      },
      onDismiss: () => setDismissedWorker(worker),
    });
  }, [canOfferUpdate, worker, t]);

  useEffect(() => {
    if (!canOfferInstall || canOfferUpdate || isUpdating || isReader) return;
    return showPwaOffer({
      offer: PWA_OFFER.INSTALL,
      t,
      onConfirm: installApp,
      onDismiss: dismissInstallOffer,
    });
  }, [canOfferInstall, canOfferUpdate, isUpdating, isReader, t]);

  return null;
}

export default PwaPrompts;
