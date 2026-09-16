import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

function useRowClamp<T extends HTMLElement>(
  children: ReactNode,
  maxRows: number,
  toggleWidth: number,
) {
  const [expanded, { open: expand }] = useDisclosure(false);
  const [visibleCount, setVisibleCount] = useState<number>();
  const [isClamped, setIsClamped] = useState(false);
  // Always holds the full, untrimmed children, so measurement never feeds back off
  // the already-trimmed visible output (see CollapsibleGroup's hidden measure clone).
  const measureRef = useRef<T>(null);

  useLayoutEffect(() => {
    const node = measureRef.current;
    const items = node ? Array.from(node.children) : [];
    if (!node || items.length === 0) {
      setVisibleCount(undefined);
      setIsClamped(false);
      return;
    }

    const rects = items.map((item) => item.getBoundingClientRect());
    let rows = 0;
    let rowBottom = -Infinity;
    let lastVisibleIndex = -1;

    rects.forEach((rect, index) => {
      // Items in the same row can still have different tops (e.g. a shorter separator
      // next to taller text, centered within the row), so a row break is a rect that
      // starts below every row seen so far rather than one with a different exact top.
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

    const clamped = rows > maxRows;
    if (clamped) {
      // The toggle button is appended right after the last visible item, so it only
      // shares that item's row if there's room left for it — otherwise drop items
      // from the end of the row until it fits, so it never wraps onto its own line.
      const containerRight = node.getBoundingClientRect().right;
      const gap = parseFloat(getComputedStyle(node).columnGap) || 0;
      let lastVisibleRect = lastVisibleIndex >= 0 ? rects[lastVisibleIndex] : undefined;
      while (lastVisibleRect && lastVisibleRect.right + gap + toggleWidth > containerRight) {
        lastVisibleIndex -= 1;
        lastVisibleRect = lastVisibleIndex >= 0 ? rects[lastVisibleIndex] : undefined;
      }
    }

    setVisibleCount(lastVisibleIndex + 1);
    setIsClamped(clamped);
  }, [children, maxRows, toggleWidth]);

  return { measureRef, expanded, expand, isClamped, visibleCount };
}

export default useRowClamp;
