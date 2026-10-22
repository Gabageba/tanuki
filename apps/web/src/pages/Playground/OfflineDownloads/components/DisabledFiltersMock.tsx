import { Button, Group, Tooltip } from '@mantine/core';
import { FunnelIcon, SortDescendingIcon } from '@phosphor-icons/react';

/** K3 — фильтры и сортировка остаются на месте, но неактивны. */
function DisabledFiltersMock() {
  return (
    <Tooltip label="Недоступно без сети">
      <Group gap="xs" w="fit-content">
        <Button variant="default" leftSection={<FunnelIcon />} disabled>
          Фильтры
        </Button>
        <Button variant="default" leftSection={<SortDescendingIcon />} disabled>
          По популярности
        </Button>
      </Group>
    </Tooltip>
  );
}

export default DisabledFiltersMock;
