import { useSyncExternalStore } from 'react';
import { Box, Loader, Menu } from '@mantine/core';
import { ArrowsClockwiseIcon, DeviceMobileIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { canInstallApp, installApp, subscribeToInstall } from '@/shared/lib/appInstall/install';
import {
  applyUpdate,
  isUpdateAvailable,
  isUpdateRequested,
  subscribeToUpdate,
} from '@/shared/lib/serviceWorker';
import MobileMenuRow from '../Footer/components/MobileMenuRow';

type Props = {
  mobile?: boolean;
  onAction?: () => void;
};

/** Одни действия для выпадающего меню и мобильного drawer. */
function PwaMenuItems({ mobile = false, onAction }: Props) {
  const { t } = useTranslation();
  const canInstall = useSyncExternalStore(subscribeToInstall, canInstallApp);
  const canUpdate = useSyncExternalStore(subscribeToUpdate, isUpdateAvailable);
  const isUpdating = useSyncExternalStore(subscribeToUpdate, isUpdateRequested);
  const Item = mobile ? MobileMenuRow : Menu.Item;

  return (
    <>
      {canInstall && (
        <Item
          leftSection={<DeviceMobileIcon />}
          onClick={() => {
            void installApp();
            onAction?.();
          }}
        >
          {t('installApp')}
        </Item>
      )}
      {canUpdate && (
        <Item
          leftSection={<ArrowsClockwiseIcon />}
          disabled={isUpdating}
          rightSection={
            isUpdating ? (
              <Loader size="xs" />
            ) : (
              <Box w={6} h={6} bdrs="50%" bg="var(--mantine-primary-color-filled)" />
            )
          }
          onClick={() => {
            void applyUpdate();
            onAction?.();
          }}
        >
          {t('updateApp')}
        </Item>
      )}
    </>
  );
}

export default PwaMenuItems;
