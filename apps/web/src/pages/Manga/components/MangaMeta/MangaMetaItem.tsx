import { DataList, Space } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import Mdash from '@/shared/ui/Mdash';
import { isEmpty } from '@/shared/lib/isEmpty';

type MetaItemValue = ReactNode | ReactNode[];

type Props<T extends MetaItemValue = MetaItemValue> = {
  label: string;
  value: T | null;
  description?: string[];
};

function MangaMetaItem<T extends MetaItemValue = MetaItemValue>({
  label,
  value: rawValue,
}: Props<T>) {
  const value = useMemo(() => {
    if (Array.isArray(rawValue)) {
      return <MidDotGroup items={rawValue} />;
    }

    return rawValue;
  }, [rawValue]);

  return (
    <DataList.Item>
      <DataList.ItemLabel fz={12} lh={1}>
        {label}
      </DataList.ItemLabel>
      <Space h={8} />
      <DataList.ItemValue lh={1}>{isEmpty(value) ? <Mdash /> : value}</DataList.ItemValue>
    </DataList.Item>
  );
}

export default MangaMetaItem;
