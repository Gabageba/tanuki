import { useEffect } from 'react';

function useReaderWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let disposed = false;
    let pending = false;
    let lock: WakeLockSentinel | null = null;
    const release = () => {
      const current = lock;
      lock = null;
      void current?.release().catch(() => {});
    };
    const sync = async () => {
      if (document.visibilityState !== 'visible') {
        release();
        return;
      }
      if (pending || (lock && !lock.released)) return;
      pending = true;
      let releasedWhileHidden = false;
      try {
        const acquired = await navigator.wakeLock.request('screen');
        if (disposed || document.visibilityState !== 'visible') {
          await acquired.release();
          releasedWhileHidden = true;
        } else {
          lock = acquired;
        }
      } catch {
        // Unsupported devices and denied requests degrade silently.
      } finally {
        pending = false;
        if (releasedWhileHidden && !disposed && document.visibilityState === 'visible') void sync();
      }
    };
    document.addEventListener('visibilitychange', sync);
    void sync();
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', sync);
      release();
    };
  }, [enabled]);
}

export default useReaderWakeLock;
