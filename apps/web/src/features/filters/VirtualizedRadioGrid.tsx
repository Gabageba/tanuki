import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FilterOption } from '@tanuki/contracts';
import RadioFilterOption from './RadioFilterOption';

/** One `RadioFilterOption` row, including the grid's own vertical gap. */
const ROW_HEIGHT = 44;

/** Matches `SimpleGrid`'s `cols={{ base: 1, xs: 2 }}` — Mantine's default `xs` breakpoint. */
const TWO_COLUMN_QUERY = '(min-width: 36em)';

type Props = {
  options: FilterOption[];
  value: string | null;
  onChange: (key: string) => void;
  scrollAreaProps?: ScrollAreaAutosizeProps;
};

function VirtualizedRadioGrid({ options, value, onChange, scrollAreaProps = {} }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const isTwoColumn = useMediaQuery(TWO_COLUMN_QUERY);
  const lanes = isTwoColumn ? 2 : 1;

  const virtualizer = useVirtualizer({
    count: options.length,
    lanes,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <ScrollArea.Autosize
      flex={1}
      mih={0}
      type="auto"
      offsetScrollbars="y"
      viewportRef={viewportRef}
      {...scrollAreaProps}
    >
      <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const option = options[virtualItem.index];
          if (!option) {
            return null;
          }

          return (
            <div
              key={option.key}
              style={{
                position: 'absolute',
                top: 0,
                left: `${(virtualItem.lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <RadioFilterOption
                option={option}
                checked={value === option.key}
                onChange={() => onChange(option.key)}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea.Autosize>
  );
}

export default VirtualizedRadioGrid;
