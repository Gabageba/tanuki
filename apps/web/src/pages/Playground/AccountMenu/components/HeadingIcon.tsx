import type { ReactNode } from 'react';
import { ThemeIcon } from '@mantine/core';

type Props = {
  children: ReactNode;
};

/** Квадрат 40px под иконку в заголовке H2 — того же размера, что аватар и логотип источника. */
function HeadingIcon({ children }: Props) {
  return (
    <ThemeIcon size={40} radius="md" variant="light" color="gray" flex="none">
      {children}
    </ThemeIcon>
  );
}

export default HeadingIcon;
