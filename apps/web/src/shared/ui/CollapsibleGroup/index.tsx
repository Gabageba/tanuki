import type { GroupProps } from '@mantine/core';
import { Anchor, Group } from '@mantine/core';
import { Children } from 'react';
import { useTranslation } from 'react-i18next';
import useRowClamp from './hooks/useRowClamp';

const DEFAULT_MAX_ROWS = 2;

type Props = {
  maxRows?: number;
} & GroupProps;

function CollapsibleGroup({ maxRows = DEFAULT_MAX_ROWS, children, gap, ...restProps }: Props) {
  const { t } = useTranslation();
  const { ref, expanded, expand, isClamped, visibleCount } = useRowClamp<HTMLDivElement>(
    children,
    maxRows,
  );

  const visibleChildren =
    expanded || visibleCount === undefined
      ? children
      : Children.toArray(children).slice(0, visibleCount);

  return (
    <Group ref={ref} {...restProps} gap={gap}>
      {visibleChildren}
      {isClamped && !expanded && (
        <Anchor component="button" type="button" onClick={expand} fw={500} lh={1} w="fit-content">
          {t('more')}
        </Anchor>
      )}
    </Group>
  );
}

export default CollapsibleGroup;
