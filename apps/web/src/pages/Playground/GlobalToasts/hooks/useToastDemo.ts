import { useEffect, useRef, useState } from 'react';
import { createDemoState } from '../lib';
import { advanceTime, offerToast, removeToast, setReaderMode } from '../queue';
import type { DemoState, DemoToast, ToastSample } from '../models';

function useToastDemo(initialSamples: ToastSample[] = []) {
  const [state, setState] = useState(() =>
    initialSamples.reduce<DemoState>(
      (current, sample) => offerToast(current, { ...sample, remaining: sample.duration }),
      createDemoState(),
    ),
  );
  const [running, setRunning] = useState(false);
  const sequence = useRef(0);
  const nextId = () => `demo-${++sequence.current}`;

  useEffect(() => {
    if (!running) return;
    let previous = performance.now();
    const tick = () => {
      const now = performance.now();
      const elapsed = now - previous;
      previous = now;
      if (document.visibilityState === 'visible')
        setState((current) => advanceTime(current, elapsed));
    };
    // Смена видимости обнуляет только точку замера, не оставшееся время карточки.
    const onVisibility = () => {
      previous = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running]);

  const push = (toast: Omit<DemoToast, 'remaining'>) =>
    setState((current) => offerToast(current, { ...toast, remaining: toast.duration }));
  const remove = (id: string) => setState((current) => removeToast(current, id));
  const setReader = (reader: boolean) => setState((current) => setReaderMode(current, reader));
  const pause = (id: string, active: boolean, focus = false) =>
    setState((current) => {
      if (focus)
        return {
          ...current,
          focused: active
            ? [...new Set([...current.focused, id])]
            : current.focused.filter((item) => item !== id),
        };
      return {
        ...current,
        hovered: active
          ? [...new Set([...current.hovered, id])]
          : current.hovered.filter((item) => item !== id),
      };
    });
  const reset = () => {
    setState(createDemoState());
    setRunning(false);
  };
  return { state, running, setRunning, push, remove, setReader, pause, nextId, reset };
}

export default useToastDemo;
