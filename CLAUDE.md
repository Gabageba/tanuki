# Code style rules

## Components

- Every UI component lives in its own file and is exported via `export default`.
- Components are always written as a `function` declaration — never an arrow function assigned to a
  const.
- The `export default` goes **after** the component declaration, on its own line at the end of the
  file (`function SourceCard() {...}` … `export default SourceCard;`) — never inline on the
  declaration.
- No `index.ts` barrels that only import a component and re-export it. Import components straight
  from their own file.
- Elements with no children are self-closing — `<ActionIcon />`, never
  `<ActionIcon></ActionIcon>`.

## Types

- Always `type`, never `interface`.
- Component props are always declared as `type Props = { ... }` — exactly `Props`, no
  `SourceCardProps`-style prefixes.
- No loose string literals in types: no `z.enum([...])`, no `'ok' | 'degraded' | 'down'`, no arrays
  of strings with a manual cast. Declare the literals once in a const object and derive the type
  from it with `EnumLiteralsOf` (`packages/contracts/src/utils.ts`):

  ```ts
  export const SOURCE_STATUS = {
    OK: 'ok',
    DEGRADED: 'degraded',
    DOWN: 'down',
  } as const;
  export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;
  ```

  Keep one such const per concept — don't copy it into parsers, contracts and API separately; reuse
  the shared one from `@tanuki/contracts`.

- Never transform those enum values in API responses (no case changes, no renaming) — whatever is
  in the const is what the frontend receives, so it can work with the values directly.
- Types and anything else bulky enough to clutter a file go into a sibling `models.ts`.

## Constants

- Constant names are UPPERCASE — `THEME`, `PRIMARY_SHADE`, `COLOR_SCHEME_MANAGER`, never `theme` or
  `colorSchemeManager`. An enum-like const object always follows `{ SCREAM_CASE: camelCase }` —
  keys UPPERCASE, values camelCase (`LIGHT: 'light'`, `RATING_COUNT: 'ratingCount'`) — even when
  the concept itself reads uppercase (an HTTP-style error code stays `NOT_FOUND: 'notFound'`, not
  `NOT_FOUND: 'NOT_FOUND'`). The one exception is a value pinned by an external contract this
  codebase doesn't own — a field mirrored verbatim from a source site's own JSON API response, or a
  value typed against a third-party library (e.g. `COLOR_SCHEME` against Mantine's
  `MantineColorScheme`) — where the value must stay exactly what that external contract expects.
- No lookup tables mapping an enum to labels, icons, colors and the like
  (`Record<ColorScheme, string>`). Write an arrow function with an exhaustive `switch` instead — no
  `default` branch, so TypeScript points at the missing case when a value is added to the enum:

  ```ts
  export const getColorSchemeLabel = (colorScheme: ColorScheme) => {
    switch (colorScheme) {
      case COLOR_SCHEME.LIGHT:
        return 'Светлая';
      case COLOR_SCHEME.DARK:
        return 'Тёмная';
      case COLOR_SCHEME.AUTO:
        return 'Системная';
    }
  };
  ```

  When such a function has to produce a React icon, it returns the rendered element
  (`return <SunIcon size={size} />`), not the component itself — a component obtained from a call
  during render is recreated on every render, and `react-hooks/static-components` fails the lint.
  That makes it a `.tsx` helper, so it lives next to the component rather than in `models.ts`.

## Placement

- Keep code next to its only consumer: constants of a component go into its sibling `models.ts` or
  straight into the component file when there are just a couple of them. `shared/` is for things
  with more than one consumer — don't create a folder there for a single import.
- No one-call wrappers around library hooks. Call the library hook in the component.

## Colors

- The accent color is declared once in `apps/web/src/app/components/Providers/models.ts`
  (`PRIMARY_COLOR`, `PRIMARY_COLOR_SHADES`, `PRIMARY_SHADE`) and reaches components through the
  Mantine theme — `color={PRIMARY_COLOR}`, `var(--mantine-primary-color-filled)`.
- Everything else takes colors from Mantine CSS variables (`var(--mantine-color-*)`) so both color
  schemes work. A hard-coded hex needs a reason in a comment — for example the always-black reader
  background.

## Typography

- Two font families, one role each — no brand-layer exception. Both are wired up once in
  `apps/web/src/app/components/Providers/models.ts` and reach components the same way colors do —
  through the Mantine theme, never re-imported per file.
- **Golos Text** — the interface default (`theme.fontFamily`, `FONT_FAMILY_SANS`). Everything is
  set in it unless it's numeric/service data or the logo: titles, headings, navigation, buttons,
  descriptions, reviews, field labels, and word-based meta strings ("2 дня назад").
- **JetBrains Mono** — the numeric and service layer (`theme.fontFamilyMonospace`, use via
  `ff="monospace"`). Chapter numbers, pages, dates, rating digits, counters, percentages, badge
  tags (NEW), small uppercase labels, breadcrumbs — anything that reads as a digit-first readout
  scanned down a column, not as speech.
- **Unbounded** — the logo only, one call site (`var(--tanuki-font-brand)`, set in
  `CSS_VARIABLES_RESOLVER`, used in the header `Anchor`). Nowhere else — block headings, section
  names, and modal titles all use Golos Text now.

## Hooks

- Hooks live in a `hooks` folder. If a hook belongs to one specific component, it goes into that
  component's own `hooks` folder.
- Hooks are written as a `function` declaration and exported via `export default` too (after the
  declaration, same as components).

## Functions

- Only components and hooks use `function` + `export default`. Every other function — helpers,
  formatters, guards, mappers, request builders — is an arrow function assigned to a const and
  exported as a **named** export (no `export default`).

  ```ts
  // component / hook
  function SourceCard() { ... }
  export default SourceCard;

  // helper
  export const formatChapterNumber = (value: number) => ...;
  ```

## Dates

- Always send dates and times in the standard server format: `YYYY-MM-DD`, or
  `YYYY-MM-DDTHH:MM:SSZ` when the time is needed.
