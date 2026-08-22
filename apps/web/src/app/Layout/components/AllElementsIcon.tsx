import { ThemeIcon } from '@mantine/core';
import { SquaresFourIcon } from '@phosphor-icons/react';

type Props = {
  size?: number;
};

function AllElementsIcon({ size = 20 }: Props) {
  return (
    <ThemeIcon size={size} bdrs="sm">
      <SquaresFourIcon />
    </ThemeIcon>
  );
}

export default AllElementsIcon;
