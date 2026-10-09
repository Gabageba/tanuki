import { Badge, Button } from '@mantine/core';
import { FunnelIcon } from '@phosphor-icons/react';

type Props = {
  count: number;
  onClick?: () => void;
};

/** «Фильтры» со счётчиком выбранного — на телефоне открывает drawer. */
function FiltersButton({ count, onClick }: Props) {
  return (
    <Button
      variant="default"
      leftSection={<FunnelIcon />}
      rightSection={
        count > 0 && (
          <Badge variant="muted" size="sm" ff="monospace" circle>
            {count}
          </Badge>
        )
      }
      onClick={onClick}
    >
      Фильтры
    </Button>
  );
}

export default FiltersButton;
