import type { GroupProps } from '@mantine/core';
import { Anchor, Box, Group } from '@mantine/core';
import { Children, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useRowClamp from './hooks/useRowClamp';

const DEFAULT_MAX_ROWS = 2;

type Props = {
  maxRows?: number;
} & GroupProps;

function CollapsibleGroup({ maxRows = DEFAULT_MAX_ROWS, children, gap, ...restProps }: Props) {
  const { t } = useTranslation();
  const moreLabel = t('more');

  // Measured off-screen so the row-fitting math in useRowClamp knows the toggle's real
  // width up front, instead of only finding out once it's already rendered and wrapped.
  const toggleMeasureRef = useRef<HTMLButtonElement>(null);
  const [toggleWidth, setToggleWidth] = useState(0);

  useLayoutEffect(() => {
    setToggleWidth(toggleMeasureRef.current?.getBoundingClientRect().width ?? 0);
  }, [moreLabel]);

  const { measureRef, expanded, expand, isClamped, visibleCount } = useRowClamp<HTMLDivElement>(
    children,
    maxRows,
    toggleWidth,
  );

  const visibleChildren =
    expanded || visibleCount === undefined
      ? children
      : Children.toArray(children).slice(0, visibleCount);

  return (
    // Single in-flow root: the measure clone and toggle are absolutely/fixed positioned,
    // so they don't pick up a parent Stack's gap as extra spacing.
    <Box pos="relative">
      {/* Always renders the full, untrimmed content so useRowClamp measures real rows
          instead of the already-trimmed output below — invisible and out of the flow. */}
      <Group
        ref={measureRef}
        {...restProps}
        gap={gap}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </Group>
      <Anchor
        ref={toggleMeasureRef}
        component="button"
        type="button"
        fw={500}
        lh="tight"
        w="fit-content"
        aria-hidden
        tabIndex={-1}
        style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' }}
      >
        {moreLabel}
      </Anchor>
      <Group {...restProps} gap={gap}>
        {visibleChildren}
        {isClamped && !expanded && (
          <Anchor
            component="button"
            type="button"
            onClick={expand}
            fw={500}
            lh="tight"
            w="fit-content"
          >
            {moreLabel}
          </Anchor>
        )}
      </Group>
    </Box>
  );
}

export default CollapsibleGroup;
