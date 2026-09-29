import type { ReactNode } from 'react';
import { Switch, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import type { DemoSource } from '../models';

type Props = {
  source: DemoSource;
  /** Подменяет иконку источника — H6 вешает на неё точку статуса. */
  icon?: ReactNode;
};

function DemoSourceRow({ source, icon }: Props) {
  return (
    <GroupedList.Row
      icon={icon ?? <SourceIcon id={source.id} title={source.title} size={32} />}
      title={source.title}
      description={
        <Text fz="sm" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      }
      action={<Switch defaultChecked aria-label={source.title} />}
    />
  );
}

export default DemoSourceRow;
