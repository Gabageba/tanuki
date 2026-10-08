import type { ReactNode } from 'react';
import { Box } from '@mantine/core';

type Props = {
  /** Радиус размытия в px; 0 — без размытия. */
  blur?: number;
  grayscale?: boolean;
  children: ReactNode;
};

/**
 * Слой обложки с фильтром. Размывается сама картинка, а не фон оверлея: `backdrop-filter` оставляет
 * у правого и нижнего края полосу почти резких пикселей. Слой выходит за обёртку на два радиуса
 * размытия — мягкий край уходит за её `overflow: hidden` при любой ширине карточки.
 */
function BlurredCover({ blur = 0, grayscale = false, children }: Props) {
  const filters = [grayscale && 'grayscale(1)', blur > 0 && `blur(${blur}px)`].filter(Boolean);

  return (
    <Box
      pos="absolute"
      inset={-2 * blur}
      style={filters.length > 0 ? { filter: filters.join(' ') } : undefined}
    >
      {children}
    </Box>
  );
}

export default BlurredCover;
