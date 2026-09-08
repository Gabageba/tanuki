import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

function useRowClamp<T extends HTMLElement>(children: ReactNode, maxRows: number) {
  const [expanded, { toggle }] = useDisclosure(false);
  const [clampHeight, setClampHeight] = useState<number>();
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    const items = node ? Array.from(node.children) : [];
    if (!node || items.length === 0) {
      setClampHeight(undefined);
      setIsClamped(false);
      return;
    }

    const containerTop = node.getBoundingClientRect().top;
    let rows = 0;
    let lastTop: number | null = null;
    let visibleBottom = 0;
    let totalHeight = 0;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (lastTop === null || rect.top !== lastTop) {
        rows += 1;
        lastTop = rect.top;
      }
      if (rows <= maxRows) {
        visibleBottom = rect.bottom - containerTop;
      }
      totalHeight = rect.bottom - containerTop;
    });

    setClampHeight(visibleBottom);
    setIsClamped(totalHeight > visibleBottom);
  }, [children, maxRows]);

  return { ref, expanded, toggle, isClamped, clampHeight };
}

export default useRowClamp;
