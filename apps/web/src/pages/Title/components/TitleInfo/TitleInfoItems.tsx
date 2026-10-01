import { DataList, Space } from '@mantine/core';
import { isEmpty } from '@/shared/lib/isEmpty';
import type { TitleInfoItem } from '../../models';

type Props = {
  items: TitleInfoItem[];
};

function TitleInfoItems({ items }: Props) {
  const filteredItems = items.filter((item) => !isEmpty(item.value));

  return (
    <DataList orientation="vertical">
      {filteredItems.map((item, index) => (
        <DataList.Item key={index}>
          <DataList.ItemLabel fz={12} lh="tight">
            {item.label}
          </DataList.ItemLabel>
          <Space h={8} />
          <DataList.ItemValue lh={1.2} ff={item.isNumeric ? 'monospace' : undefined}>
            {item.value}
          </DataList.ItemValue>
        </DataList.Item>
      ))}
    </DataList>
  );
}

export default TitleInfoItems;
