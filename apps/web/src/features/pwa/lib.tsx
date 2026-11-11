import { ArrowsClockwiseIcon, DeviceMobileIcon } from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import { PWA_OFFER, type PwaOffer } from './models';

export const getPwaOffer = (offer: PwaOffer, t: TFunction) => {
  switch (offer) {
    case PWA_OFFER.UPDATE:
      return {
        title: t('updateAvailable'),
        description: t('appReloadsDownloadsResume'),
        action: t('updateApp'),
        icon: <ArrowsClockwiseIcon size={20} />,
      };
    case PWA_OFFER.INSTALL:
      return {
        title: t('installTanuki'),
        description: t('launchTanukiFromShortcut'),
        action: t('installApp'),
        icon: <DeviceMobileIcon size={20} />,
      };
  }
};
