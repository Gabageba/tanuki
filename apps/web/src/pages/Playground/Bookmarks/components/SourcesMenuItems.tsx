import { Menu, Text } from '@mantine/core';
import { catalogEntryFor, type SourceId } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sourceIds: SourceId[];
};

/** Пункты меню «Открыть на источнике» — общие для всех вариантов оси Q, где список в Menu. */
function SourcesMenuItems({ sourceIds }: Props) {
  return (
    <>
      <Menu.Label>Открыть на источнике</Menu.Label>
      {sourceIds.map((sourceId) => {
        const { title } = catalogEntryFor(sourceId);

        return (
          <Menu.Item
            key={sourceId}
            leftSection={<SourceIcon id={sourceId} title={title} size={18} radius="sm" />}
          >
            <Text inherit>{title}</Text>
          </Menu.Item>
        );
      })}
    </>
  );
}

export default SourcesMenuItems;
