import type {
  AlertVariant,
  BadgeVariant,
  ButtonVariant,
  PillVariant,
  MantineSize,
  TabsVariant,
} from '@mantine/core';

/**
 * Adds the `tile` variant registered in `THEME.components.Button` to Mantine's own
 * (closed) `ButtonVariant` union, so `variant="tile"` type-checks without a cast.
 * See https://mantine.dev/styles/variants-sizes/#adding-variants-to-components.
 *
 * `muted`, registered in `THEME.variantColorResolver`: a translucent tint of `color` with a border
 * of the same color, text in `color`; a bit denser on hover.
 */
type ExtendedButtonVariant = ButtonVariant | 'tile' | 'muted';

/**
 * Same `tile` variant, registered in `THEME.components.Tabs` — a pill with a border that
 * only highlights on the active tab, no filled background.
 */
type ExtendedTabsVariant = TabsVariant | 'tile';

/**
 * Same `muted` for `Alert` — the same tint as the button; the icon keeps the color, title and
 * message stay neutral.
 */
type ExtendedAlertVariant = AlertVariant | 'muted';

/** Same `muted` for `Badge` — tint, border and text all in `color`. */
type ExtendedBadgeVariant = BadgeVariant | 'muted';

/** Same `muted` for `Pill`, set in `THEME.components.Pill.styles` — always in the primary color. */
type ExtendedPillVariant = PillVariant | 'muted';

declare module '@mantine/core' {
  /** `tight` — плотный межстрочный интервал из `theme.lineHeights` (см. `LINE_HEIGHT_TIGHT`). */
  export interface MantineThemeSizesOverride {
    lineHeights: Record<MantineSize | 'tight', string>;
  }

  export interface AlertProps {
    variant?: ExtendedAlertVariant;
  }

  export interface BadgeProps {
    variant?: ExtendedBadgeVariant;
  }

  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }

  export interface PillProps {
    variant?: ExtendedPillVariant;
  }

  export interface TabsProps {
    variant?: ExtendedTabsVariant;
  }
}
