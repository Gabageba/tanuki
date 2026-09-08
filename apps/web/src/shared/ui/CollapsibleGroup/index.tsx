import type { GroupProps } from '@mantine/core';
import { Anchor, Group, Stack } from '@mantine/core';
import useRowClamp from './hooks/useRowClamp';

const DEFAULT_MAX_ROWS = 2;

type Props = {
  maxRows?: number;
} & GroupProps;

function CollapsibleGroup({ maxRows = DEFAULT_MAX_ROWS, children, gap, ...restProps }: Props) {
  const { ref, expanded, toggle, isClamped, clampHeight } = useRowClamp<HTMLDivElement>(
    children,
    maxRows,
  );

  return (
    <Stack gap={gap}>
      <Group
        ref={ref}
        {...restProps}
        gap={gap}
        mah={expanded ? undefined : clampHeight}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </Group>
      {(isClamped || expanded) && (
        <Anchor component="button" type="button" onClick={toggle} fw={500} lh={1} w="fit-content">
          {expanded ? 'Свернуть' : 'Показать все'}
        </Anchor>
      )}
    </Stack>
  );
}

export default CollapsibleGroup;
