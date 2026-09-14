import type { ButtonVariant } from '@mantine/core';

/**
 * Adds the `selectable` variant registered in `THEME.components.Button` to Mantine's own
 * (closed) `ButtonVariant` union, so `variant="selectable"` type-checks without a cast.
 * See https://mantine.dev/styles/variants-sizes/#adding-variants-to-components.
 */
type ExtendedButtonVariant = ButtonVariant | 'selectable';

declare module '@mantine/core' {
  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }
}
