import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';

type Props = {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Секция одного источника: шапка, карточки, иногда подвал. */
function SourceSection({ header, footer, children }: Props) {
  return (
    <Stack gap="sm">
      {header}
      {children}
      {footer}
    </Stack>
  );
}

export default SourceSection;
