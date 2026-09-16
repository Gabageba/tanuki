import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

function useRowClamp<T extends HTMLElement>(children: ReactNode, maxRows: number) {
  const [expanded, { open: expand }] = useDisclosure(false);
  const [visibleCount, setVisibleCount] = useState<number>();
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    const items = node ? Array.from(node.children) : [];
    if (!node || items.length === 0) {
      setVisibleCount(undefined);
      setIsClamped(false);
      return;
    }

    let rows = 0;
    let rowBottom = -Infinity;
    let lastVisibleIndex = -1;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (rect.top >= rowBottom) {
        rows += 1;
        rowBottom = rect.bottom;
      } else {
        rowBottom = Math.max(rowBottom, rect.bottom);
      }
      if (rows <= maxRows) {
        lastVisibleIndex = index;
      }
    });

    setVisibleCount(lastVisibleIndex + 1);
    setIsClamped(rows > maxRows);
  }, [children, maxRows]);

  return { ref, expanded, expand, isClamped, visibleCount };
}

export default useRowClamp;
