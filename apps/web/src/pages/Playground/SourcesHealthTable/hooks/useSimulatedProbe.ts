import { useEffect, useRef, useState } from 'react';

const PROBE_DURATION_MS = 1500;

/** Имитация проверки: крутилка на кнопке полторы секунды — запроса нет. */
function useSimulatedProbe() {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const run = () => {
    setIsPending(true);
    timeoutRef.current = setTimeout(() => setIsPending(false), PROBE_DURATION_MS);
  };

  return { isPending, run };
}

export default useSimulatedProbe;
