import type { MouseEvent } from 'react';

/** Строка — ссылка в читалку: клик по иконке до неё доходить не должен. */
export const stopRowClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};
