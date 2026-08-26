import { useEffect } from 'react';
import { registerDrawerClose } from '@/shared/lib/drawerRegistry';

function useAutoCloseDrawer(opened: boolean, onClose: () => void) {
  useEffect(() => {
    if (!opened) return undefined;

    return registerDrawerClose(onClose);
  }, [opened, onClose]);
}

export default useAutoCloseDrawer;
