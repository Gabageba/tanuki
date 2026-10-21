import { Group, Scroller, Skeleton, Tabs } from '@mantine/core';
import type { ReactNode } from 'react';
import TextSkeleton from './TextSkeleton';

type Props = {
  /** Ширины названий вкладок — разные, чтобы полоса не выглядела штампом. */
  widths: number[];
  /** Кнопки справа от вкладок — скелетоном, как у настоящей полосы. */
  actions?: ReactNode;
};

/**
 * Полоса вкладок скелетоном, собранная из тех же `Tabs`, что и настоящая: та же высота, отступы и
 * линия под вкладками — при загрузке ничего не прыгает.
 */
function TabsSkeleton({ widths, actions }: Props) {
  return (
    <Tabs value={null}>
      <Tabs.List style={{ flexWrap: 'nowrap' }}>
        <Group gap={0} wrap="nowrap" flex={1} miw={0} style={{ overflow: 'hidden' }}>
          <Scroller>
            {widths.map((width, index) => (
              <Tabs.Tab
                key={index}
                value={String(index)}
                disabled
                leftSection={<Skeleton h={16} w={16} circle />}
                style={{ opacity: 1 }}
              >
                <TextSkeleton fz="sm" w={width} />
              </Tabs.Tab>
            ))}
          </Scroller>
        </Group>
        {actions && (
          <Group gap={2} wrap="nowrap" pl="xs" flex="none" align="center">
            {actions}
          </Group>
        )}
      </Tabs.List>
    </Tabs>
  );
}

export default TabsSkeleton;
