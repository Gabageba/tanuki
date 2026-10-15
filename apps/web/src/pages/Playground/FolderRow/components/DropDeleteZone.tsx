import { Group, Text } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';
import { TrashIcon } from '@phosphor-icons/react';
import { DROP_ZONE_ID } from '../models';

/** D3 — подвал списка, пока тащат свою папку: бросить сюда — удалить. */
function DropDeleteZone() {
  const { setNodeRef, isOver } = useDroppable({ id: DROP_ZONE_ID });

  return (
    <Group
      ref={setNodeRef}
      justify="center"
      gap="xs"
      py="sm"
      c="red"
      bd="1px dashed var(--mantine-color-red-outline)"
      bg={isOver ? 'var(--mantine-color-red-light)' : undefined}
      style={{ borderRadius: 'var(--mantine-radius-md)' }}
    >
      <TrashIcon size={16} />
      <Text fz="sm">Отпустите здесь, чтобы удалить папку</Text>
    </Group>
  );
}

export default DropDeleteZone;
