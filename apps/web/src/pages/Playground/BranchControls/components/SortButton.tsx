import { Button, type ButtonProps } from '@mantine/core';
import { SortAscendingIcon, SortDescendingIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';

type Props = {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
  size?: ButtonProps['size'];
};

/** Та же кнопка, что в TitleChaptersSettings, только направление живёт в стейте варианта. */
function SortButton({ direction, onChange, size }: Props) {
  const isDesc = direction === SORT_DIRECTION.DESC;

  return (
    <Button
      variant="default"
      size={size}
      leftSection={isDesc ? <SortDescendingIcon /> : <SortAscendingIcon />}
      onClick={() => onChange(isDesc ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC)}
    >
      {isDesc ? 'Сначала новые' : 'Сначала старые'}
    </Button>
  );
}

export default SortButton;
